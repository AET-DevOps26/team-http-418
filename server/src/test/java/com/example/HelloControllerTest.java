package com.example;

import com.example.server.HelloController;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class HelloControllerTest {

    @Test
    public void testHelloController() {
        HelloController controller = new HelloController();
        String result = controller.hello();
        assertEquals("Hello from Spring Boot Server!", result);
    }
}