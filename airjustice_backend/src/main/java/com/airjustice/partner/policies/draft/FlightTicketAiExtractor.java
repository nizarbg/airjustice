package com.airjustice.partner.policies.draft;

import com.airjustice.partner.policies.draft.dto.*;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
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
import java.util.stream.Collectors;

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

    // ── Known IATA 2-letter airline codes (most common, used to validate flight numbers) ──
    private static final Set<String> KNOWN_AIRLINES = Set.of(
            "AA","AC","AF","AI","AK","AM","AR","AS","AT","AV","AY","AZ",
            "BA","BE","BG","BI","BJ","BK","BL","BT","BW",
            "CA","CI","CJ","CK","CL","CM","CO","CP","CX","CZ",
            "DE","DL","DY",
            "EI","EK","EN","ET","EW","EY",
            "FB","FI","FJ","FR","FZ",
            "GA","GF","GS",
            "HA","HG","HM","HU","HX","HY",
            "IB","IG","IR",
            "JL","JQ","JU",
            "KC","KE","KL","KM","KQ","KU",
            "LA","LG","LH","LO","LT","LX","LY",
            "MA","MF","MH","MK","MS","MU",
            "NH","NK","NZ",
            "OA","OK","OM","ON","OS","OU","OZ",
            "PC","PG","PK","PR","PS","PU","PX",
            "QF","QR","QS",
            "RJ","RO","RS",
            "SA","SB","SK","SN","SQ","SR","SS","SU","SV","SW",
            "TA","TG","TK","TN","TP","TU","TX",
            "UA","UL","UM","UN","UP","US","UT","UX",
            "VA","VN","VS","VT","VW","VX","VY",
            "WB","WF","WN","WS","WY","WZ",
            "XC","XL","XQ",
            "YM",
            "ZH","ZI"
    );

    // ── Flight-number pattern: IATA 2-letter airline + 1–4 digits + optional letter suffix ──
    // More restrictive: requires at least 2 digits to reduce false positives
    private static final Pattern FLIGHT_RE = Pattern.compile(
            "\\b([A-Z]{2})\\s{0,2}(\\d{2,4}[A-Z]?)\\b"
    );

    // ── IATA airport code: exactly 3 uppercase letters ──
    private static final Pattern IATA_RE = Pattern.compile("\\b([A-Z]{3})\\b");

    // ── Route patterns: "GVA-ZRH", "GVA→ZRH", "GVA / ZRH", "FROM GVA TO ZRH", "GVA TO ZRH" ──
    private static final Pattern ROUTE_RE = Pattern.compile(
            "\\b([A-Z]{3})\\s*(?:[-–—→>]|TO|/|\\|)\\s*([A-Z]{3})\\b"
    );

    // ── "FROM: XXX" / "DEPART: XXX" / "DEPARTURE: XXX" / "ORIGIN: XXX" ──
    private static final Pattern DEP_LABEL_RE = Pattern.compile(
            "(?:FROM|DEPART(?:URE)?|ORIGIN|DEP)[:\\s]+([A-Z]{3})\\b",
            Pattern.CASE_INSENSITIVE
    );
    // ── "TO: XXX" / "ARRIVAL: XXX" / "DEST: XXX" / "DESTINATION: XXX" ──
    private static final Pattern ARR_LABEL_RE = Pattern.compile(
            "(?:TO|ARRIV(?:AL|EE)?|DEST(?:INATION)?|ARR)[:\\s]+([A-Z]{3})\\b",
            Pattern.CASE_INSENSITIVE
    );

    // ── Date patterns (extended to catch more formats) ──
    private static final Pattern DATE_RE = Pattern.compile(
            "(\\d{4}-\\d{2}-\\d{2})"                                             // YYYY-MM-DD
            + "|(\\d{2}/\\d{2}/\\d{4})"                                          // DD/MM/YYYY
            + "|(\\d{2}-\\d{2}-\\d{4})"                                          // DD-MM-YYYY
            + "|(\\d{2}\\.\\d{2}\\.\\d{4})"                                      // DD.MM.YYYY
            + "|(\\d{1,2}\\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\\s*\\d{4})"  // 15 JAN 2025, 15 JANUARY 2025
            + "|((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\\s+\\d{1,2},?\\s+\\d{4})" // JAN 15, 2025
            + "|(\\d{2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\\d{2,4})",               // 15JAN25 or 15JAN2025 (compact)
            Pattern.CASE_INSENSITIVE
    );

    // ── Time pattern (HH:MM, HH:MM:SS, or Hhmm with context) ──
    private static final Pattern TIME_RE = Pattern.compile(
            "\\b(\\d{2}:\\d{2}(?::\\d{2})?)\\b"
            + "|\\b(\\d{4})\\s*(?:HRS?|H)\\b"      // 1430HRS, 0930H
    );

    // ── Passenger name patterns ──
    // Uses line-aware extraction: captures text after label until end of line,
    // then cleans it by removing trailing form-label words.
    // Supports EN/FR/DE labels.
    private static final Pattern NAME_LABEL_RE = Pattern.compile(
            "(?:PASSENGER|PASSAGIER|NAME|NOM|PASSAGER|PAX|TRAVELL?ER|VOYAGEUR|REISENDER)"
                    + "\\s*[:.]?\\s+"               // separator (colon, dot, or whitespace)
                    + "([A-Za-z][A-Za-z /.'-]{1,60})",  // the name (stop at non-alpha or line end)
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
    );

    // Known form-label / field-header words that should NOT be part of a name.
    // These are used to truncate a name candidate that accidentally captured trailing labels.
    private static final Set<String> FORM_LABEL_WORDS = Set.of(
            // German
            "TICKETNUMMER", "TICKET", "NUMMER", "NUMBER", "ZAHLUNGSART", "ZAHLUNGS",
            "FLUGNUMMER", "FLUG", "BUCHUNG", "BUCHUNGSNUMMER", "BUCHUNGSCODE",
            "SITZPLATZ", "SITZ", "KLASSE", "DATUM", "ABFLUG", "ANKUNFT",
            "GATE", "TERMINAL", "BOARDING", "GEPÄCK", "GEPACK", "REISE",
            "BESTÄTIGUNG", "BESTATIGUNG", "PREIS", "BETRAG", "STEUER",
            // English
            "CONFIRMATION", "BOOKING", "REFERENCE", "RECEIPT",
            "SEAT", "CLASS", "DATE", "DEPARTURE", "ARRIVAL", "FLIGHT",
            "BAGGAGE", "LUGGAGE", "FARE", "TOTAL", "AMOUNT", "PAYMENT",
            "STATUS", "ISSUED", "DOCUMENT", "INVOICE", "FORM", "TYPE",
            "SEQUENCE", "CHECK", "CHECKIN",
            // French
            "BILLET", "RÉSERVATION", "RESERVATION", "SIÈGE", "SIEGE",
            "CLASSE", "DÉPART", "DEPART", "ARRIVÉE", "ARRIVEE", "BAGAGE",
            "TARIF", "MONTANT", "PAIEMENT", "STATUT", "FACTURE"
    );

    private static final Pattern NAME_SLASH_RE = Pattern.compile(
            "\\b([A-Z]{2,25})/([A-Z]{2,25})(?:\\s+(MR|MRS|MS|MISS|MSTR|CHD|INF))?\\b"
    );
    // "MR JOHN DOE" or "MRS DOE JANE" or "HERR MAX MUSTERMANN"
    private static final Pattern NAME_TITLE_RE = Pattern.compile(
            "\\b(MR|MRS|MS|MISS|MSTR|HERR|FRAU)\\s+([A-Z][A-Z\\s'-]{3,40})\\b"
    );

    // ── Month name map for normalisation ──
    private static final Map<String, String> MONTH_MAP = Map.ofEntries(
            Map.entry("JAN", "01"), Map.entry("JANUARY", "01"),
            Map.entry("FEB", "02"), Map.entry("FEBRUARY", "02"),
            Map.entry("MAR", "03"), Map.entry("MARCH", "03"),
            Map.entry("APR", "04"), Map.entry("APRIL", "04"),
            Map.entry("MAY", "05"),
            Map.entry("JUN", "06"), Map.entry("JUNE", "06"),
            Map.entry("JUL", "07"), Map.entry("JULY", "07"),
            Map.entry("AUG", "08"), Map.entry("AUGUST", "08"),
            Map.entry("SEP", "09"), Map.entry("SEPTEMBER", "09"),
            Map.entry("OCT", "10"), Map.entry("OCTOBER", "10"),
            Map.entry("NOV", "11"), Map.entry("NOVEMBER", "11"),
            Map.entry("DEC", "12"), Map.entry("DECEMBER", "12"),
            // French months
            Map.entry("JANV", "01"), Map.entry("JANVIER", "01"),
            Map.entry("FEVR", "02"), Map.entry("FEVRIER", "02"), Map.entry("FÉVRIER", "02"),
            Map.entry("MARS", "03"),
            Map.entry("AVRIL", "04"), Map.entry("AVR", "04"),
            Map.entry("MAI", "05"),
            Map.entry("JUIN", "06"),
            Map.entry("JUIL", "07"), Map.entry("JUILLET", "07"),
            Map.entry("AOUT", "08"), Map.entry("AOÛT", "08"),
            Map.entry("SEPT", "09"), Map.entry("SEPTEMBRE", "09"),
            Map.entry("OCTOBRE", "10"),
            Map.entry("NOVEMBRE", "11"),
            Map.entry("DECEMBRE", "12"), Map.entry("DÉCEMBRE", "12")
    );

    // ── Expanded false-positive filter for 3-letter words ──
    private static final Set<String> NON_IATA_WORDS = Set.of(
            "THE","FOR","AND","NOT","BUT","ARE","PDF","PNG","JPG","GIF","BMP","TIF","DOC",
            "PNR","REF","TUE","WED","THU","FRI","SAT","SUN","MON","MRS","MIS","MPS",
            "JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC",
            "TAX","NET","AIR","FLY","PAX","ROW","BAG","VIA","ANY","ONE","TWO","ALL",
            "NEW","OLD","AGE","WAY","USE","SEC","YES","YRS","MHZ","FEE","WEB","URL",
            "VOL","REG","NOM","NOS","OUI","DES","LES","UNE","PAR","SUR","SON","PAS",
            "MAN","CAN","HER","HIS","ITS","OUR","OUT","DAY","END","FAR","FEW","GOT",
            "HAD","HAS","HIM","HOW","LET","MAD","MEN","NOR","NOW","OWN","RAN","RUN",
            "SAW","SAY","SHE","SIT","TOP","TRY","WAS","WHO","WHY","WON","YET","YOU",
            "ADD","BIG","BOX","BUS","CUT","DID","DOG","EAR","EAT","EGG","EYE","FIT",
            "FUN","GAS","GOD","GUN","GUY","HIT","HOT","ICE","ILL","JOB","JOY","KEY",
            "KID","LAW","LAY","LEG","LIP","LOG","LOT","LOW","MAP","MET","MIX","MOM",
            "ODD","OIL","PAY","PEN","PET","PIN","POT","PUT","RAW","RED","RID","SET",
            "SIX","SKI","SKY","TEN","TIE","TIP","TOE","TON","TOO","VAN","WAR",
            "WET","WOK","WOW","ZOO",
            "EUR","USD","CHF","GBP","CAD","AUD","INR","JPY","CNY",
            "MRN","ETD","ETA","EST","GMT","UTC","CET","IST",
            "BIZ","COM","ORG","GOV","EDU","MIL",
            "SSR","TSA","TST","INV","RCV","QTY","STD","STA","NUL","CRS","POS"
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
                String text = extractPdfText(doc.getData());
                if (text == null || text.isBlank()) {
                    String ocrText = ocrPdfPages(doc.getData());
                    if (ocrText != null) combined.append(ocrText).append("\n");
                } else {
                    combined.append(text).append("\n");
                }
            } else if (ct.equals("image/jpeg") || ct.equals("image/png")) {
                String ocrText = ocrImage(doc.getData());
                if (ocrText != null) combined.append(ocrText).append("\n");
            }

            String name = Optional.ofNullable(doc.getFilename()).orElse("");
            combined.append(" ").append(name.toUpperCase());
        }

        String rawText = combined.toString();
        String text = rawText.toUpperCase();

        log.debug("Extracted raw text length: {}", text.length());

        // ── Split text into lines for line-by-line analysis ──
        String[] lines = text.split("\\r?\\n");

        // ──────────────────────────────────────────────────────────────────────
        // 1. EXTRACT PASSENGER NAME (multiple strategies)
        // ──────────────────────────────────────────────────────────────────────
        String passengerName = "";
        double passengerConf = 0.0;

        // Strategy 1: Labelled name — process LINE BY LINE to avoid capturing adjacent fields.
        // On tickets, "Name" might be followed on the SAME line by the actual name,
        // but the next field label (Ticketnummer, Zahlungsart, etc.) may also be on the same line.
        // We match the label, capture the rest, then TRUNCATE at the first known form-label word.
        for (String line : lines) {
            if (passengerConf >= 0.7) break; // already found a good match
            Matcher mn = NAME_LABEL_RE.matcher(line);
            if (mn.find()) {
                String candidate = truncateAtFormLabel(mn.group(1).trim());
                candidate = candidate.replaceAll("\\s+", " ").trim();
                // Validate: no digits, reasonable length, not a single common word
                if (isPlausibleName(candidate)) {
                    passengerName = cleanName(candidate);
                    passengerConf = 0.8;
                }
            }
        }

        // Strategy 2: IATA "LASTNAME/FIRSTNAME" (highest confidence if valid)
        if (passengerName.isEmpty()) {
            Matcher ms = NAME_SLASH_RE.matcher(text);
            while (ms.find()) {
                String last = ms.group(1);
                String first = ms.group(2);
                if (last.length() >= 2 && first.length() >= 2
                        && !KNOWN_AIRLINES.contains(last)
                        && !NON_IATA_WORDS.contains(last)
                        && !NON_IATA_WORDS.contains(first)
                        && !FORM_LABEL_WORDS.contains(last)
                        && !FORM_LABEL_WORDS.contains(first)) {
                    passengerName = capitalise(first) + " " + capitalise(last);
                    passengerConf = 0.75;
                    break;
                }
            }
        }

        // Strategy 3: "MR/MRS/MS/HERR/FRAU FIRSTNAME LASTNAME"
        if (passengerName.isEmpty()) {
            Matcher mt2 = NAME_TITLE_RE.matcher(text);
            if (mt2.find()) {
                String nameRaw = truncateAtFormLabel(mt2.group(2).trim());
                nameRaw = nameRaw.replaceAll("\\s+", " ").trim();
                if (isPlausibleName(nameRaw)) {
                    passengerName = cleanName(nameRaw);
                    passengerConf = 0.7;
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // 2. EXTRACT ALL DATES & TIMES
        // ──────────────────────────────────────────────────────────────────────
        List<String> allDates = new ArrayList<>();
        Matcher md = DATE_RE.matcher(rawText.toUpperCase());
        while (md.find()) {
            String normalised = normaliseDate(md.group(0).trim());
            if (normalised != null) allDates.add(normalised);
        }
        // Deduplicate while preserving order
        allDates = allDates.stream().distinct().collect(Collectors.toList());

        List<String> allTimes = new ArrayList<>();
        Matcher mtm = TIME_RE.matcher(rawText.toUpperCase());
        while (mtm.find()) {
            if (mtm.group(1) != null) {
                allTimes.add(mtm.group(1));
            } else if (mtm.group(2) != null) {
                // Convert "1430" → "14:30"
                String t = mtm.group(2);
                allTimes.add(t.substring(0, 2) + ":" + t.substring(2));
            }
        }
        allTimes = allTimes.stream().distinct().collect(Collectors.toList());

        // ──────────────────────────────────────────────────────────────────────
        // 3. EXTRACT ROUTES (departure → arrival pairs)
        // ──────────────────────────────────────────────────────────────────────
        List<String[]> routes = new ArrayList<>(); // each: [dep, arr]

        // Strategy A: explicit route arrows/separators  "GVA-ZRH", "GVA → ZRH"
        Matcher mr = ROUTE_RE.matcher(text);
        while (mr.find()) {
            String dep = mr.group(1);
            String arr = mr.group(2);
            if (!NON_IATA_WORDS.contains(dep) && !NON_IATA_WORDS.contains(arr)) {
                routes.add(new String[]{dep, arr});
            }
        }

        // Strategy B: labelled "FROM: GVA" / "TO: ZRH"
        if (routes.isEmpty()) {
            List<String> depLabelled = new ArrayList<>();
            List<String> arrLabelled = new ArrayList<>();
            Matcher mdep = DEP_LABEL_RE.matcher(text);
            while (mdep.find()) depLabelled.add(mdep.group(1).toUpperCase());
            Matcher marr = ARR_LABEL_RE.matcher(text);
            while (marr.find()) arrLabelled.add(marr.group(1).toUpperCase());
            int pairCount = Math.min(depLabelled.size(), arrLabelled.size());
            for (int i = 0; i < pairCount; i++) {
                routes.add(new String[]{depLabelled.get(i), arrLabelled.get(i)});
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // 4. EXTRACT FLIGHT NUMBERS (validated against known airline codes)
        // ──────────────────────────────────────────────────────────────────────
        List<String> flights = new ArrayList<>();
        Set<String> seenFlights = new LinkedHashSet<>(); // deduplication

        Matcher mf = FLIGHT_RE.matcher(text);
        while (mf.find()) {
            String airline = mf.group(1);
            String number = mf.group(2);
            String flightNum = airline + number;
            // Validate: either the airline code is known OR it appears near route/flight context
            if (KNOWN_AIRLINES.contains(airline) && !seenFlights.contains(flightNum)) {
                seenFlights.add(flightNum);
                flights.add(flightNum);
            }
        }

        // Fallback: if no known-airline flight found, accept any 2-letter + 3-4 digits
        if (flights.isEmpty()) {
            Matcher mf2 = FLIGHT_RE.matcher(text);
            while (mf2.find()) {
                String airline = mf2.group(1);
                String number = mf2.group(2);
                String flightNum = airline + number;
                // Require at least 3 digits to reduce false positives when airline is unknown
                if (number.replaceAll("[A-Z]", "").length() >= 3 && !seenFlights.contains(flightNum)) {
                    seenFlights.add(flightNum);
                    flights.add(flightNum);
                }
            }
        }

        // Further fallback: accept 2-digit flights only if no flights found yet
        if (flights.isEmpty()) {
            Matcher mf3 = FLIGHT_RE.matcher(text);
            while (mf3.find()) {
                String airline = mf3.group(1);
                String number = mf3.group(2);
                String flightNum = airline + number;
                if (!NON_IATA_WORDS.contains(airline) && !seenFlights.contains(flightNum)) {
                    seenFlights.add(flightNum);
                    flights.add(flightNum);
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // 5. EXTRACT STANDALONE IATA AIRPORT CODES (fallback for routes)
        // ──────────────────────────────────────────────────────────────────────
        List<String> standaloneIatas = extractIataCodes(text);

        // ──────────────────────────────────────────────────────────────────────
        // 6. BUILD SEGMENTS (smart pairing)
        // ──────────────────────────────────────────────────────────────────────
        List<ExtractedSegmentDto> segs = new ArrayList<>();

        if (!flights.isEmpty()) {
            for (int i = 0; i < flights.size(); i++) {
                String fn = flights.get(i);
                String airlineCode = fn.substring(0, 2);

                // Determine route for this segment
                String dep = null;
                String arr = null;
                if (i < routes.size()) {
                    dep = routes.get(i)[0];
                    arr = routes.get(i)[1];
                } else {
                    // Fallback to standalone IATA codes (2 per segment)
                    int iataBase = i * 2;
                    if (iataBase < standaloneIatas.size()) dep = standaloneIatas.get(iataBase);
                    if (iataBase + 1 < standaloneIatas.size()) arr = standaloneIatas.get(iataBase + 1);
                }

                // Determine date/time for this segment
                String segDate = i < allDates.size() ? allDates.get(i)
                        : (!allDates.isEmpty() ? allDates.get(0) : null);
                String segTime = i < allTimes.size() ? allTimes.get(i)
                        : (!allTimes.isEmpty() ? allTimes.get(0) : null);

                String dateTime = null;
                if (segDate != null) {
                    dateTime = segDate + "T"
                            + (segTime != null ? segTime + (segTime.length() == 5 ? ":00" : "") : "00:00:00");
                }

                double confFlight = KNOWN_AIRLINES.contains(airlineCode) ? 0.85 : 0.6;
                double confRoute = dep != null && arr != null ? 0.75 : (dep != null || arr != null ? 0.4 : 0.2);
                double confDt = segDate != null ? (segTime != null ? 0.8 : 0.55) : 0.15;

                segs.add(new ExtractedSegmentDto(fn, dep, arr, airlineCode, dateTime,
                        confFlight, confRoute, confDt));
            }
        } else if (!routes.isEmpty()) {
            // We found routes but no flight numbers
            for (int i = 0; i < routes.size(); i++) {
                String dep = routes.get(i)[0];
                String arr = routes.get(i)[1];
                String segDate = i < allDates.size() ? allDates.get(i)
                        : (!allDates.isEmpty() ? allDates.get(0) : null);
                String segTime = i < allTimes.size() ? allTimes.get(i)
                        : (!allTimes.isEmpty() ? allTimes.get(0) : null);
                String dateTime = null;
                if (segDate != null) {
                    dateTime = segDate + "T"
                            + (segTime != null ? segTime + (segTime.length() == 5 ? ":00" : "") : "00:00:00");
                }
                segs.add(new ExtractedSegmentDto(null, dep, arr, null, dateTime,
                        0.0, 0.7, segDate != null ? 0.6 : 0.15));
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

    // ─────────────────────────────────────────────────────────────────────────
    // IATA CODE EXTRACTION (validated against false-positive list)
    // ─────────────────────────────────────────────────────────────────────────

    private List<String> extractIataCodes(String text) {
        List<String> iatas = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        Matcher mi = IATA_RE.matcher(text);
        while (mi.find()) {
            String code = mi.group(1);
            if (!NON_IATA_WORDS.contains(code) && !seen.contains(code)) {
                // Additional filter: skip codes that are part of a flight number match
                // (they would be the airline prefix concatenated – but since flight regex
                //  captures 2-letter airline separately, 3-letter matches are usually airports)
                seen.add(code);
                iatas.add(code);
            }
        }
        return iatas;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NAME HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /** Capitalise first letter of each word: "JOHN DOE" → "John Doe" */
    private String capitalise(String s) {
        if (s == null || s.isEmpty()) return s;
        StringBuilder sb = new StringBuilder();
        for (String word : s.split("\\s+")) {
            if (!word.isEmpty()) {
                if (!sb.isEmpty()) sb.append(' ');
                sb.append(Character.toUpperCase(word.charAt(0)));
                if (word.length() > 1) sb.append(word.substring(1).toLowerCase());
            }
        }
        return sb.toString();
    }

    /** Clean extracted name: trim, normalise spaces, capitalise */
    private String cleanName(String raw) {
        String cleaned = raw.replaceAll("/", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return capitalise(cleaned);
    }

    /**
     * Truncate a name candidate at the first word that is a known form-label.
     * E.g. "John Doe Ticketnummer Ticket Number Zahlungsart" → "John Doe"
     */
    private String truncateAtFormLabel(String candidate) {
        if (candidate == null) return "";
        String[] words = candidate.split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            String upper = word.toUpperCase().replaceAll("[^A-ZÀ-Ü]", "");
            if (FORM_LABEL_WORDS.contains(upper)) break;
            if (!result.isEmpty()) result.append(' ');
            result.append(word);
        }
        return result.toString().trim();
    }

    /**
     * Check if a candidate string looks like a plausible human name.
     * Must be: at least 2 characters, no digits, not a single known label word.
     */
    private boolean isPlausibleName(String candidate) {
        if (candidate == null || candidate.length() < 2) return false;
        // No digits
        if (candidate.matches(".*\\d.*")) return false;
        // At least one letter
        if (!candidate.matches(".*[A-Za-zÀ-ÿ].*")) return false;
        // Not a single common/form-label word
        String upper = candidate.toUpperCase().trim();
        if (FORM_LABEL_WORDS.contains(upper)) return false;
        if (NON_IATA_WORDS.contains(upper)) return false;
        // Should have at least 2 characters after cleanup
        String cleaned = candidate.replaceAll("[^A-Za-zÀ-ÿ]", "");
        return cleaned.length() >= 2;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF TEXT EXTRACTION
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
        if (tessdataPath != null && !tessdataPath.isBlank()) {
            tess.setDatapath(tessdataPath);
        }
        tess.setLanguage(ocrLanguage);
        tess.setPageSegMode(3);   // automatic page segmentation
        tess.setOcrEngineMode(1); // LSTM neural net for best accuracy
        return tess;
    }

    /**
     * OCR a single image (JPG/PNG) using Tesseract.
     * Processing is entirely on-premise; no data leaves the server.
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
     * and running Tesseract on it. All processing is on-premise.
     */
    private String ocrPdfPages(byte[] pdfData) {
        try (PDDocument pdf = PDDocument.load(pdfData)) {
            PDFRenderer renderer = new PDFRenderer(pdf);
            Tesseract tess = createTesseract();
            StringBuilder sb = new StringBuilder();

            int pageCount = Math.min(pdf.getNumberOfPages(), 5);
            for (int i = 0; i < pageCount; i++) {
                BufferedImage pageImg = renderer.renderImageWithDPI(i, 300);
                try {
                    String pageText = tess.doOCR(pageImg);
                    if (pageText != null && !pageText.isBlank()) {
                        sb.append(pageText).append("\n");
                    }
                } catch (TesseractException e) {
                    log.warn("Tesseract OCR failed on PDF page {}: {}", i, e.getMessage());
                } finally {
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

    // ─────────────────────────────────────────────────────────────────────────
    // DATE NORMALISATION (extended)
    // ─────────────────────────────────────────────────────────────────────────

    private String normaliseDate(String raw) {
        if (raw == null) return null;
        raw = raw.trim();

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

        // DD.MM.YYYY
        if (raw.matches("\\d{2}\\.\\d{2}\\.\\d{4}")) {
            String[] p = raw.split("\\.");
            return p[2] + "-" + p[1] + "-" + p[0];
        }

        // "15 JAN 2025" / "15 JANUARY 2025" / "5 MAR 2025"
        String upper = raw.toUpperCase();
        Matcher m1 = Pattern.compile("(\\d{1,2})\\s*([A-Z]{3,10})\\s*(\\d{4})").matcher(upper);
        if (m1.matches()) {
            String month = resolveMonth(m1.group(2));
            if (month != null) {
                String day = String.format("%02d", Integer.parseInt(m1.group(1)));
                return m1.group(3) + "-" + month + "-" + day;
            }
        }

        // "JAN 15, 2025" / "JANUARY 15 2025"
        Matcher m2 = Pattern.compile("([A-Z]{3,10})\\s+(\\d{1,2}),?\\s+(\\d{4})").matcher(upper);
        if (m2.matches()) {
            String month = resolveMonth(m2.group(1));
            if (month != null) {
                String day = String.format("%02d", Integer.parseInt(m2.group(2)));
                return m2.group(3) + "-" + month + "-" + day;
            }
        }

        // Compact: "15JAN25" or "15JAN2025"
        Matcher m3 = Pattern.compile("(\\d{2})([A-Z]{3})(\\d{2,4})").matcher(upper);
        if (m3.matches()) {
            String month = resolveMonth(m3.group(2));
            if (month != null) {
                String day = m3.group(1);
                String year = m3.group(3);
                if (year.length() == 2) year = "20" + year;
                return year + "-" + month + "-" + day;
            }
        }

        return null;
    }

    private String resolveMonth(String s) {
        if (s == null) return null;
        return MONTH_MAP.get(s.toUpperCase());
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
}
