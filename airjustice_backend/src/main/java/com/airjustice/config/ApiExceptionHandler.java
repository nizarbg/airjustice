package com.airjustice.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestPartException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::formatFieldError)
                .toList();

        String message = errors.isEmpty() ? "Donnees invalides." : errors.get(0);

        return build(HttpStatus.BAD_REQUEST, message, req, errors);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, Object>> handleMissingPart(MissingServletRequestPartException ex, HttpServletRequest req) {
        String partName = ex.getRequestPartName();
        String message = "Document manquant";
        if (partName != null && !partName.isBlank()) {
            message = "Champ multipart requis manquant: " + partName;
        }
        return build(HttpStatus.BAD_REQUEST, message, req, List.of(message));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxSize(MaxUploadSizeExceededException ex, HttpServletRequest req) {
        String message = "Fichier trop volumineux (limite depassee).";
        return build(HttpStatus.PAYLOAD_TOO_LARGE, message, req, List.of(message));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex, HttpServletRequest req) {
        String message = safeMessage(ex.getMessage(), "Une erreur est survenue.");
        HttpStatus status = message.toLowerCase().contains("deja utilise")
                ? HttpStatus.CONFLICT
                : HttpStatus.BAD_REQUEST;

        return build(status, message, req, List.of(message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, HttpServletRequest req) {
        String message = "Erreur interne du serveur.";
        return build(HttpStatus.INTERNAL_SERVER_ERROR, message, req, List.of(message));
    }

    private String formatFieldError(FieldError err) {
        String field = err.getField();
        String msg = safeMessage(err.getDefaultMessage(), "valeur invalide");
        return field + ": " + msg;
    }

    private String safeMessage(String msg, String fallback) {
        return (msg == null || msg.isBlank()) ? fallback : msg;
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, String message, HttpServletRequest req, List<String> errors) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("errors", errors);
        body.put("path", req.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}

