package com.saborandino.api.generic;

import java.util.ArrayList;
import java.util.List;

public abstract class ResponseGeneric {
    private String type;
    public final List<String> listMessage;

    protected ResponseGeneric() {
        this.type = "error";
        this.listMessage = new ArrayList<>();
    }

    public String getType() {
        return type;
    }

    public void success() {
        this.type = "success";
    }

    public void warning() {
        this.type = "warning";
    }

    public void error() {
        this.type = "error";
    }

    public void exception() {
        this.type = "exception";
    }
}
