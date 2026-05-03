package com.example.server;

import org.springframework.web.bind.annotation.GetMapping;

public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot Server!";
    }
}
