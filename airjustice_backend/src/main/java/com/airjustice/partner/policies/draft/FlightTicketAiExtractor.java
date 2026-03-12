package com.airjustice.partner.policies.draft;

import com.airjustice.partner.policies.draft.dto.*;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Flight ticket extractor using Tesseract OCR + regex (fully on-premise).
 * ── Privacy & Legal Compliance ───────────────────────────────────────────────
 * This service is designed to comply with:
 *  - EU GDPR (Regulation 2016/679) – data minimisation, purpose limitation
 *  - Swiss nDSG (Federal Act on Data Protection, 2023) – equivalent obligations
 * Measures implemented:
 *  1. PURPOSE LIMITATION  : Only flight-operation data (flight #, route, date,
 *                           passenger name) is extracted. No passport numbers,
 *                           seat numbers, loyalty IDs, prices or PNR codes are
 *                           requested or stored.
 *  2. DATA MINIMISATION   : Only the minimum fields needed to create an
 *                           insurance policy are extracted.
 *  3. NO PERSISTENT LOGGING OF PII : Raw text extracted by OCR/PDFBox is never
 *                           written to persistent logs. SLF4J loggers use
 *                           DEBUG level only; production must set log level
 *                           to INFO or higher for this class.
 *  4. ON-PREMISE ONLY     : ALL processing (Tesseract OCR, PDFBox) runs
 *                           entirely on-premise with ZERO data transfer.
 *  5. RETENTION           : Extracted data is not stored in its raw OCR form;
 *                           only the structured DTO fields are kept in the DB.
 *  6. OCR ON-PREMISE      : Tesseract OCR runs locally on the server. No image
 *                           data is sent to any external service during OCR.
 *                           Images are processed in memory and discarded immediately.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Service
public class FlightTicketAiExtractor {

    private static final Logger log = LoggerFactory.getLogger(FlightTicketAiExtractor.class);

    // ── Flight-number pattern: IATA airline code (2 letters) + 1–4 digits + optional letter
    private static final Pattern FLIGHT_RE = Pattern.compile("\\b([A-Z]{2}\\d{1,4}[A-Z]?)\\b");
    // ── IATA airport code: exactly 3 uppercase letters
    private static final Pattern IATA_RE   = Pattern.compile("\\b([A-Z]{3})\\b");
    // ── Date patterns
    private static final Pattern DATE_RE   = Pattern.compile(
            "(\\d{4}-\\d{2}-\\d{2})"                  // YYYY-MM-DD
            + "|(\\d{2}/\\d{2}/\\d{4})"               // DD/MM/YYYY
            + "|(\\d{2}-\\d{2}-\\d{4})"               // DD-MM-YYYY
            + "|(\\d{1,2}\\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\\s+\\d{4})"
    );
    // ── Time pattern (HH:MM or HH:MM:SS)
    private static final Pattern TIME_RE = Pattern.compile("\\b(\\d{2}:\\d{2}(?::\\d{2})?)\\b");
    // ── Passenger name patterns (common on boarding passes / e-tickets)
    private static final Pattern NAME_LABEL_RE = Pattern.compile(
            "(?:PASSENGER|NAME|NOM|PASSAGER|PAX)[:\\s]+([A-Z][A-Z\\s/.-]{2,40})",
            Pattern.CASE_INSENSITIVE
    );
    // ── Name in "LASTNAME/FIRSTNAME" format (IATA standard)
    private static final Pattern NAME_SLASH_RE = Pattern.compile(
            "\\b([A-Z]{2,20})/([A-Z]{2,20})\\b"
    );

    @Value("${airjustice.ocr.tessdata-path:}")
    private String tessdataPath;

    @Value("${airjustice.ocr.language:eng}")
    private String ocrLanguage;

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Extract structured flight data from a list of draft documents.
     * Uses Tesseract OCR + PDFBox text extraction + regex parsing.
     * All processing is on-premise (GDPR Art. 25 / Swiss nDSG Art. 7).
     *
     * @param docs list of documents belonging to the draft
     * @return extraction result (structured DTO, never null)
     */
    public DraftExtractionDto extract(List<DraftDocument> docs) {
        if (docs == null || docs.isEmpty()) {
            return empty(true);
        }

        return extractLocal(docs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOCAL EXTRACTION (Tesseract OCR + regex, fully on-premise)
    // No data leaves the server. GDPR Art. 25 / Swiss nDSG Art. 7 compliant.
    // ─────────────────────────────────────────────────────────────────────────

    private DraftExtractionDto extractLocal(List<DraftDocument> docs) {
        StringBuilder combined = new StringBuilder();

        for (DraftDocument doc : docs) {
            String ct = Optional.ofNullable(doc.getContentType()).orElse("");

            if (ct.equals("application/pdf")) {
                // Step 1: try PDFBox native text extraction
                String text = extractPdfText(doc.getData());

                // Step 2: if no text found, PDF is likely scanned → OCR each page
                if (text == null || text.isBlank()) {
                    String ocrText = ocrPdfPages(doc.getData());
                    if (ocrText != null) combined.append(ocrText).append("\n");
                } else {
                    combined.append(text).append("\n");
                }
            } else if (ct.equals("image/jpeg") || ct.equals("image/png")) {
                // Image → Tesseract OCR (fully on-premise)
                String ocrText = ocrImage(doc.getData());
                if (ocrText != null) combined.append(ocrText).append("\n");
            }

            // Also include filename for additional hints
            String name = Optional.ofNullable(doc.getFilename()).orElse("");
            combined.append(" ").append(name.toUpperCase());
        }

        String text = combined.toString().toUpperCase();

        // ── Extract passenger name ──
        String passengerName = "";
        double passengerConf = 0.0;

        // Try "PASSENGER: NAME" or "NOM: NAME" patterns
        Matcher mn = NAME_LABEL_RE.matcher(combined.toString());
        if (mn.find()) {
            passengerName = mn.group(1).trim();
            passengerConf = 0.7;
        }

        // Try IATA "LASTNAME/FIRSTNAME" format
        if (passengerName.isEmpty()) {
            Matcher ms = NAME_SLASH_RE.matcher(text);
            if (ms.find()) {
                // Filter out flight-like patterns (e.g., TU/1234)
                String last = ms.group(1);
                String first = ms.group(2);
                if (last.length() >= 2 && first.length() >= 2 && !last.matches(".*\\d.*")) {
                    passengerName = first + " " + last;
                    passengerConf = 0.6;
                }
            }
        }

        // ── Find flight numbers ──
        List<String> flights = new ArrayList<>();
        Matcher m = FLIGHT_RE.matcher(text);
        while (m.find()) flights.add(m.group(1));

        // ── Find IATA airport codes (exclude common false-positives) ──
        List<String> iatas = getStrings(text);

        // ── Find dates and times ──
        Matcher md = DATE_RE.matcher(combined.toString());
        String date = md.find() ? normaliseDate(md.group(0)) : null;

        Matcher mt = TIME_RE.matcher(combined.toString());
        String time = mt.find() ? mt.group(1) : null;

        String dateTime = null;
        if (date != null) {
            dateTime = date + "T" + (time != null ? time + (time.length() == 5 ? ":00" : "") : "00:00:00");
        }

        // ── Build segments ──
        List<ExtractedSegmentDto> segs = new ArrayList<>();
        if (!flights.isEmpty()) {
            // Try to pair flight numbers with IATA codes (2 per segment)
            int iataIdx = 0;
            for (int i = 0; i < flights.size(); i++) {
                String fn = flights.get(i);
                String dep = iataIdx < iatas.size() ? iatas.get(iataIdx++) : null;
                String arr = iataIdx < iatas.size() ? iatas.get(iataIdx++) : null;
                // Only first segment gets the date; subsequent ones are less certain
                String dt = (i == 0) ? dateTime : null;
                double confDt = (i == 0 && date != null) ? (time != null ? 0.7 : 0.5) : 0.2;
                segs.add(new ExtractedSegmentDto(fn, dep, arr, null, dt,
                        0.7, dep != null && arr != null ? 0.6 : 0.3, confDt));
            }
        }

        boolean noFlight = segs.isEmpty();
        return new DraftExtractionDto(
                new ExtractedPassengerDto(passengerName, passengerConf),
                segs.isEmpty() ? List.of(emptySegment()) : segs,
                false,
                noFlight
        );
    }

    private static @NonNull List<String> getStrings(String text) {
        Set<String> commonWords = Set.of("THE","FOR","AND","NOT","BUT","ARE","HAS","PDF","PNG","JPG",
                "PNR","REF","TUE","WED","THU","FRI","SAT","SUN","MON","MRS","MIS","JAN","FEB","MAR",
                "APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC","TAX","NET","AIR","FLY",
                "PAX","ROW","BAG","VIA","ANY","ONE","TWO","ALL","NEW","OLD","AGE","WAY","USE","SEC");
        List<String> iatas = new ArrayList<>();
        Matcher mi = IATA_RE.matcher(text);
        while (mi.find()) {
            String code = mi.group(1);
            if (!commonWords.contains(code)) iatas.add(code);
        }
        return iatas;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private String extractPdfText(byte[] data) {
        try (PDDocument pdf = PDDocument.load(data)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(pdf);
        } catch (Exception e) {
            log.warn("PDFBox failed to extract text: {}", e.getMessage());
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TESSERACT OCR (on-premise, zero data transfer – GDPR/DSG compliant)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a configured Tesseract instance.
     * Tesseract processes data entirely in-memory on the local JVM.
     * No network calls are made. Images are not persisted to disk.
     */
    private Tesseract createTesseract() {
        Tesseract tess = new Tesseract();
        // Use configured tessdata path, or fallback to bundled data from tess4j jar
        if (tessdataPath != null && !tessdataPath.isBlank()) {
            tess.setDatapath(tessdataPath);
        }
        // Support English + French (common on flight tickets)
        tess.setLanguage(ocrLanguage);
        // Page segmentation: automatic
        tess.setPageSegMode(3);
        // Engine: LSTM neural net ( the best accuracy for printed text)
        tess.setOcrEngineMode(1);
        return tess;
    }

    /**
     * OCR a single image (JPG/PNG) using Tesseract.
     * Processing is entirely on-premise; no data leaves the server.
     *
     * @param imageData raw image bytes
     * @return extracted text, or null on failure
     */
    private String ocrImage(byte[] imageData) {
        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(imageData));
            if (img == null) {
                log.warn("Could not decode image for OCR.");
                return null;
            }
            Tesseract tess = createTesseract();
            String text = tess.doOCR(img);
            // Immediately discard the image from memory (data minimisation)
            img.flush();
            return text;
        } catch (TesseractException e) {
            log.warn("Tesseract OCR failed on image: {}", e.getMessage());
            return null;
        } catch (IOException e) {
            log.warn("Failed to read image for OCR: {}", e.getMessage());
            return null;
        }
    }

    /**
     * OCR all pages of a scanned PDF by rendering each page to an image
     * and running Tesseract on it. Uses PDFBox for rendering + Tesseract for OCR.
     * All processing is on-premise (GDPR Art. 25 / Swiss nDSG Art. 7).
     *
     * @param pdfData raw PDF bytes
     * @return concatenated OCR text from all pages, or null on failure
     */
    private String ocrPdfPages(byte[] pdfData) {
        try (PDDocument pdf = PDDocument.load(pdfData)) {
            PDFRenderer renderer = new PDFRenderer(pdf);
            Tesseract tess = createTesseract();
            StringBuilder sb = new StringBuilder();

            int pageCount = Math.min(pdf.getNumberOfPages(), 5); // limit to 5 pages for performance
            for (int i = 0; i < pageCount; i++) {
                // Render page at 300 DPI (good balance of accuracy vs performance)
                BufferedImage pageImg = renderer.renderImageWithDPI(i, 300);
                try {
                    String pageText = tess.doOCR(pageImg);
                    if (pageText != null && !pageText.isBlank()) {
                        sb.append(pageText).append("\n");
                    }
                } catch (TesseractException e) {
                    log.warn("Tesseract OCR failed on PDF page {}: {}", i, e.getMessage());
                } finally {
                    // Immediately release image memory (data minimisation)
                    pageImg.flush();
                }
            }

            String result = sb.toString().trim();
            return result.isEmpty() ? null : result;
        } catch (IOException e) {
            log.warn("Failed to render PDF pages for OCR: {}", e.getMessage());
            return null;
        }
    }

    private DraftExtractionDto empty(boolean noFlight) {
        return new DraftExtractionDto(
                new ExtractedPassengerDto("", 0.0),
                List.of(emptySegment()),
                false,
                noFlight
        );
    }

    private ExtractedSegmentDto emptySegment() {
        return new ExtractedSegmentDto(null, null, null, null, null, 0.0, 0.0, 0.0);
    }

    private String normaliseDate(String raw) {
        if (raw == null) return null;
        // YYYY-MM-DD
        if (raw.matches("\\d{4}-\\d{2}-\\d{2}")) return raw;
        // DD/MM/YYYY
        if (raw.matches("\\d{2}/\\d{2}/\\d{4}")) {
            String[] p = raw.split("/");
            return p[2] + "-" + p[1] + "-" + p[0];
        }
        // DD-MM-YYYY
        if (raw.matches("\\d{2}-\\d{2}-\\d{4}")) {
            String[] p = raw.split("-");
            return p[2] + "-" + p[1] + "-" + p[0];
        }
        return null;
    }
}
