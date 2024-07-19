package com.licenta.handgesture.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

/**
 * Configuration class that binds the properties defined in the application's properties file prefixed with "oxygen.account" to this class's fields.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "handgesture")
public class ApplicationPropertiesConfig {

	/**
	 * The number of days until a deleted user is permanently deleted from the system.
	 */
	 private int daysUntilDeletion;
	 
	 /**
	  * The secret key for JWT Token
	  */
	 private String secretKey;

	 /**
	  * The number of days until a new user is permanently deleted from the system.
	  */
	 private int daysForEmailConfirmation;
}
