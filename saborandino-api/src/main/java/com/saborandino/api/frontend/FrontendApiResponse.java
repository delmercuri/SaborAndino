package com.saborandino.api.frontend;

import java.util.ArrayList;
import java.util.List;

public class FrontendApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private final List<String> errors = new ArrayList<>();

    public static <T> FrontendApiResponse<T> ok(String message, T data) {
        FrontendApiResponse<T> response = new FrontendApiResponse<>();
        response.success = true;
        response.message = message;
        response.data = data;
        return response;
    }

    public static <T> FrontendApiResponse<T> fail(String message) {
        FrontendApiResponse<T> response = new FrontendApiResponse<>();
        response.success = false;
        response.message = message;
        response.errors.add(message);
        return response;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public List<String> getErrors() { return errors; }
}
