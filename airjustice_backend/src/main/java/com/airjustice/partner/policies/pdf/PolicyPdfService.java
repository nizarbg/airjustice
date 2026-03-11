package com.airjustice.partner.policies.pdf;

import com.airjustice.partner.policies.PartnerPolicy;
import com.airjustice.partner.policies.PolicySegmentRepo;
import lombok.AllArgsConstructor;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
@AllArgsConstructor
public class PolicyPdfService {

    private final PolicySegmentRepo segmentRepo;

    public byte[] buildPolicyPdf(PartnerPolicy p) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 16);
                cs.newLineAtOffset(50, 780);
                cs.showText("AirJustice — Police #" + p.getId());
                cs.endText();

                float y = 740;

                y = line(cs, 50, y, "Client: " + safe(p.getClientName()));
                y = line(cs, 50, y, "Email: " + safe(p.getClientEmail()));
                y = line(cs, 50, y, "Tel: " + safe(p.getClientPhone()));
                y -= 10;

                y = line(cs, 50, y, "Vol principal: " + safe(p.getFlightNumber()) + " | " + safe(p.getDepIata()) + " -> " + safe(p.getArrIata()));
                y = line(cs, 50, y, "Date: " + (p.getFlightDate() == null ? "-" : p.getFlightDate().toString()));
                y = line(cs, 50, y, "Prix: " + p.getPrice() + " " + safe(p.getCurrency()));
                y -= 10;

                y = line(cs, 50, y, "Segments:");
                cs.setFont(PDType1Font.HELVETICA, 11);

                var segs = segmentRepo.findByPolicyId(p.getId());
                for (var s : segs) {
                    y = line(cs, 60, y, "- " + safe(s.getFlightNumber()) + " " + safe(s.getDepIata()) + "->" + safe(s.getArrIata())
                            + " @ " + (s.getDepartureDateTime() == null ? "-" : s.getDepartureDateTime().toString()));
                    if (y < 80) break;
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF.");
        }
    }

    private float line(PDPageContentStream cs, float x, float y, String text) throws Exception {
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA, 12);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - 18;
    }

    private String safe(String s) { return (s == null || s.isBlank()) ? "-" : s; }
}