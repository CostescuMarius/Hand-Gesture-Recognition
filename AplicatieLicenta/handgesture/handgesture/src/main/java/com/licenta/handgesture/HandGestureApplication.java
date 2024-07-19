package com.licenta.handgesture;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HandGestureApplication {

	public static void main(String[] args) {
		SpringApplication.run(HandGestureApplication.class, args);
	}

}
