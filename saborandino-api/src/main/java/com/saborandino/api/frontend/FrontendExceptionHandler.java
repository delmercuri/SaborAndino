package com.saborandino.api.frontend;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class FrontendExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<FrontendApiResponse<Void>> handleValidation(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(FrontendApiResponse.fail(ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<FrontendApiResponse<Void>> handleIntegrity(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(FrontendApiResponse.fail("La operación no se pudo completar porque existen datos relacionados o duplicados."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<FrontendApiResponse<Void>> handleBeanValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(error -> error.getDefaultMessage())
            .orElse("Revisa los datos enviados.");
        return ResponseEntity.badRequest().body(FrontendApiResponse.fail(message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<FrontendApiResponse<Void>> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(FrontendApiResponse.fail("Ocurrió un error interno. Revisa la consola del backend para obtener más información."));
    }
}
