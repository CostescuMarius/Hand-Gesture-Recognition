package com.licenta.handgesture.dto;

import java.util.Map;

import com.licenta.handgesture.type.EmailType;

import lombok.Getter;
import lombok.Setter;

/**
 * An object representing email information.
 */
@Getter
@Setter
public class EmailInfo {

	/**
	 * The type of the email.
	 */
	private EmailType type;

	/**
	 * The email address of the recipient.
	 */
	private String emailAddress;

	/**
	 * Data for constructing the email content.
	 */
	private Map<String, Object> emailData;
}
