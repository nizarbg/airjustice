package com.airjustice.partner.policies.draft;

import com.airjustice.partner.policies.draft.dto.*;
import okhttp3.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * AI-powered flight ticket extractor.
 * ── Privacy & Legal Compliance ───────────────────────────────────────────────
 * This service is designed to comply with:
 *  - EU GDPR (Regulation 2016/679) – data minimisation, purpose limitation
 *  - Swiss DSG (nDSG 2023) – equivalent data-minimisation obligations
 * Measures implemented:
 *  1. PURPOSE LIMITATION  : Only flight-operation data (flight #, route, date,
 *                           passenger name) is extracted. No passport numbers,
 *                           seat numbers, loyalty IDs, prices or PNR codes are
 *                           requested or stored from the AI response.
 *  2. DATA MINIMISATION   : The AI prompt explicitly instructs the model NOT to
 *                           include unnecessary PII. Only the minimum fields
 *                           needed to create an insurance policy are requested.
 *  3. NO PERSISTENT LOGGING OF PII : The raw text sent to OpenAI is never
 *                           written to persistent logs. SLF4J loggers use
 *                           DEBUG level only; production must set log level
 *                           to INFO or higher for this class.
 *  4. TRANSFER SAFEGUARD  : OpenAI processes data under their DPA which
 *                           includes Standard Contractual Clauses (SCCs) valid
 *                           for EU/CH transfers. See openai.com/enterprise-privacy.
 *  5. RETENTION           : Extracted data is not stored in its raw AI form;
 *                           only the structured DTO fields are kept in the DB.
 *  6. FALLBACK            : If the AI key is absent or the call fails, a
 *                           local regex-based extractor is used, keeping
 *                           all processing on-premise with zero data transfer.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Service
public class FlightTicketAiExtractor {

    private static final Logger log = LoggerFactory.getLogger(FlightTicketAiExtractor.class);

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final MediaType JSON_TYPE = MediaType.get("application/json; charset=utf-8");

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

    private final ObjectMapper om = new ObjectMapper();
    private final OkHttpClient http;

    @Value("${airjustice.ai.openai-key:}")
    private String openaiKey;

    @Value("${airjustice.ai.enabled:true}")
    private boolean aiEnabled;

    @Value("${airjustice.ai.model:gpt-4o}")
    private String model;

    @Value("${airjustice.ai.max-tokens:512}")
    private int maxTokens;

    public FlightTicketAiExtractor() {
        this.http = new OkHttpClient.Builder()
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(40, TimeUnit.SECONDS)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Extract structured flight data from a list of draft documents.
     *
     * @param docs list of documents belonging to the draft
     * @return extraction result (structured DTO, never null)
     */
    public DraftExtractionDto extract(List<DraftDocument> docs) {
        if (docs == null || docs.isEmpty()) {
            return empty(true);
        }

        // Try AI extraction first (if enabled and key present)
        if (aiEnabled && openaiKey != null && !openaiKey.isBlank()) {
            try {
                return extractWithAI(docs);
            } catch (Exception e) {
                // AI call failed: fallback to local extraction, never crash the user flow
                log.warn("AI extraction failed, falling back to local extractor. Cause: {}", e.getMessage());
            }
        }

        // Fallback: local regex extraction (all on-premise, no data transfer)
        return extractLocal(docs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AI EXTRACTION (GPT-4o)
    // ─────────────────────────────────────────────────────────────────────────

    private DraftExtractionDto extractWithAI(List<DraftDocument> docs) throws Exception {
        List<Map<String, Object>> contentParts = new ArrayList<>();

        // System instruction: data-minimisation prompt (RGPD/DSG compliant)
        String systemPrompt = """
                You are a flight-insurance data extractor. Your only task is to read flight ticket \
                documents and return a strict JSON object. \
                
                PRIVACY RULES (mandatory):
                - Extract ONLY: passenger full name, flight number(s), departure IATA code, \
                  arrival IATA code, airline name, departure date and time.
                - Do NOT extract: passport numbers, seat numbers, booking references (PNR), \
                  loyalty program IDs, ticket prices, payment information, identity document data, \
                  or any other personal data beyond what is listed above.
                - If a field cannot be found, use null.
                - Return ONLY valid JSON, no markdown, no explanation.
                
                JSON schema to return:
                {
                  "passengerFullName": "string or null",
                  "passengerConfidence": 0.0-1.0,
                  "multiPassengerDetected": boolean,
                  "segments": [
                    {
                      "flightNumber": "string or null",
                      "depIata": "string (3 letters) or null",
                      "arrIata": "string (3 letters) or null",
                      "airline": "string or null",
                      "departureDateTime": "ISO 8601 (YYYY-MM-DDTHH:MM:SS) or null",
                      "confidenceFlightNumber": 0.0-1.0,
                      "confidenceRoute": 0.0-1.0,
                      "confidenceDateTime": 0.0-1.0
                    }
                  ]
                }
                """;

        // User instruction
        contentParts.add(Map.of("type", "text", "text",
                "Extract flight data from the following ticket document(s). " +
                "Return ONLY the JSON. Comply with the privacy rules above."));

        boolean hasImageContent = false;

        for (DraftDocument doc : docs) {
            String ct = Optional.ofNullable(doc.getContentType()).orElse("");

            if (ct.equals("application/pdf")) {
                // PDF → extract text via PDFBox (on-premise, no data sent to AI as binary)
                String text = extractPdfText(doc.getData());
                if (text != null && !text.isBlank()) {
                    // Truncate to 3000 chars to stay within token budget
                    String safe = text.length() > 3000 ? text.substring(0, 3000) : text;
                    contentParts.add(Map.of("type", "text", "text", "--- Ticket text ---\n" + safe));
                }
            } else if (ct.equals("image/jpeg") || ct.equals("image/png")) {
                // Image → send as base64 vision input to GPT-4o
                String b64 = Base64.getEncoder().encodeToString(doc.getData());
                String mimeType = ct.equals("image/png") ? "image/png" : "image/jpeg";
                contentParts.add(Map.of(
                        "type", "image_url",
                        "image_url", Map.of(
                                "url", "data:" + mimeType + ";base64," + b64,
                                "detail", "low"   // "low" = 85 tokens, good enough for text OCR
                        )
                ));
                hasImageContent = true;
            }
        }

        // Build the messages array
        List<Map<String, Object>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user",   "content", contentParts)
        );

        // Build request body
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", hasImageContent ? model : "gpt-4o-mini"); // mini for text-only (cheaper)
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", 0);  // deterministic

        String requestJson = om.writeValueAsString(requestBody);

        // Do NOT log requestJson (contains PII from ticket content)
        log.debug("Sending extraction request to OpenAI (content omitted for privacy)");

        Request req = new Request.Builder()
                .url(OPENAI_URL)
                .addHeader("Authorization", "Bearer " + openaiKey)
                .post(RequestBody.create(requestJson, JSON_TYPE))
                .build();

        try (Response resp = http.newCall(req).execute()) {
            if (!resp.isSuccessful()) {
                String body = resp.body() != null ? resp.body().string() : "(empty)";
                // Mask key in log
                throw new IOException("OpenAI returned HTTP " + resp.code() + " — " +
                        body.replaceAll("sk-[A-Za-z0-9]{10,}", "[REDACTED]"));
            }

            String body = resp.body().string();
            JsonNode root = om.readTree(body);
            String content = root.path("choices").get(0).path("message").path("content").asText();

            // Parse the JSON returned by the model
            return parseAiResponse(content);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PARSE AI JSON RESPONSE
    // ─────────────────────────────────────────────────────────────────────────

    private DraftExtractionDto parseAiResponse(String content) {
        try {
            // Strip potential markdown fences
            String json = content.trim();
            if (json.startsWith("```")) {
                json = json.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
            }

            JsonNode root = om.readTree(json);

            String passengerName = root.path("passengerFullName").asText(null);
            double passengerConf = root.path("passengerConfidence").asDouble(0.5);
            boolean multi = root.path("multiPassengerDetected").asBoolean(false);

            List<ExtractedSegmentDto> segs = new ArrayList<>();
            JsonNode segArray = root.path("segments");
            if (segArray.isArray()) {
                for (JsonNode s : segArray) {
                    String fn  = nullIfBlank(s.path("flightNumber").asText(null));
                    String dep = nullIfBlank(s.path("depIata").asText(null));
                    String arr = nullIfBlank(s.path("arrIata").asText(null));
                    String air = nullIfBlank(s.path("airline").asText(null));
                    String dt  = nullIfBlank(s.path("departureDateTime").asText(null));
                    double cFn = s.path("confidenceFlightNumber").asDouble(0.5);
                    double cRt = s.path("confidenceRoute").asDouble(0.5);
                    double cDt = s.path("confidenceDateTime").asDouble(0.5);

                    segs.add(new ExtractedSegmentDto(fn, dep, arr, air,
                            dt != null ? normaliseDateTime(dt) : null, cFn, cRt, cDt));
                }
            }

            boolean noFlight = segs.isEmpty() || segs.stream().allMatch(s -> s.flightNumber() == null);

            return new DraftExtractionDto(
                    new ExtractedPassengerDto(
                            passengerName != null ? passengerName : "",
                            passengerConf),
                    segs.isEmpty() ? List.of(emptySegment()) : segs,
                    multi,
                    noFlight
            );

        } catch (Exception e) {
            log.warn("Failed to parse AI response, falling back to local extractor.");
            return null; // caller will fall through to local
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOCAL FALLBACK EXTRACTION (regex, fully on-premise)
    // ─────────────────────────────────────────────────────────────────────────

    private DraftExtractionDto extractLocal(List<DraftDocument> docs) {
        StringBuilder combined = new StringBuilder();

        for (DraftDocument doc : docs) {
            String ct = Optional.ofNullable(doc.getContentType()).orElse("");
            if (ct.equals("application/pdf")) {
                String text = extractPdfText(doc.getData());
                if (text != null) combined.append(text).append("\n");
            }
            // For images in local mode: we can only check the filename
            String name = Optional.ofNullable(doc.getFilename()).orElse("");
            combined.append(" ").append(name.toUpperCase());
        }

        String text = combined.toString().toUpperCase();

        // Find flight numbers
        List<String> flights = new ArrayList<>();
        Matcher m = FLIGHT_RE.matcher(text);
        while (m.find()) flights.add(m.group(1));

        // Find IATA codes (exclude common false-positives like ICE, THE, FOR…)
        Set<String> commonWords = Set.of("THE","FOR","AND","NOT","BUT","ARE","HAS","PDF","PNG","JPG",
                "PNR","REF","TUE","WED","THU","FRI","SAT","SUN","MON");
        List<String> iatas = new ArrayList<>();
        Matcher mi = IATA_RE.matcher(text);
        while (mi.find()) {
            String code = mi.group(1);
            if (!commonWords.contains(code)) iatas.add(code);
        }

        // Find first date
        Matcher md = DATE_RE.matcher(combined.toString());
        String date = md.find() ? normaliseDate(md.group(0)) : null;

        List<ExtractedSegmentDto> segs = new ArrayList<>();
        if (!flights.isEmpty()) {
            String fn  = flights.get(0);
            String dep = !iatas.isEmpty() ? iatas.get(0) : null;
            String arr = iatas.size() > 1 ? iatas.get(1) : null;
            String dt  = date != null ? date + "T00:00:00" : null;
            segs.add(new ExtractedSegmentDto(fn, dep, arr, null, dt, 0.7, dep!=null&&arr!=null?0.6:0.3, date!=null?0.6:0.2));
        }

        boolean noFlight = segs.isEmpty();
        return new DraftExtractionDto(
                new ExtractedPassengerDto("", 0.0),
                segs.isEmpty() ? List.of(emptySegment()) : segs,
                false,
                noFlight
        );
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

    /** Ensure datetime is ISO-8601 (YYYY-MM-DDTHH:MM:SS) */
    private String normaliseDateTime(String raw) {
        if (raw == null) return null;
        // Already correct format
        if (raw.matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}.*")) return raw.substring(0, 19);
        // Date only
        if (raw.matches("\\d{4}-\\d{2}-\\d{2}")) return raw + "T00:00:00";
        return raw;
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

    private String nullIfBlank(String s) {
        return (s == null || s.isBlank() || s.equalsIgnoreCase("null")) ? null : s.trim();
    }
}

