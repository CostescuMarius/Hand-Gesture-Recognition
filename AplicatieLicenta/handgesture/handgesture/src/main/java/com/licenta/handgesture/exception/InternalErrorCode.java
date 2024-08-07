package com.licenta.handgesture.exception;

import lombok.Getter;

/**
 * This class is used to define specific error codes
 */
@Getter
public enum InternalErrorCode {
	
	/**
	 * It represents the specific error that occurs when a user tries to register with an email that already exists in the system.
	 */
	EMAIL_ALREADY_EXISTS(1001),
	
	/**
	 * The error that occurs when the email field is empty.
	 */
	EMPTY_EMAIL(1002),
	
	/**
	 * The error that occurs when the email is invalid.
	 */
	INVALID_EMAIL(1003),
	
	/**
	 * The error that occurs when the name field is empty.
	 */
	EMPTY_NAME(1004),
	
	/**
	 * The error that occurs when the password field is empty.
	 */
	EMPTY_PASSWORD(1005),
	
	/**
	 * The error that occurs when the password is invalid.
	 */
	INVALID_PASSWORD(1006),
	
	/**
	 * The error that occurs when the user registration fails.
	 */
	REGISTRATION_FAILED(1007),
	
	/**
	 * The error that occurs when the current request validation fails.
	 */
	THE_CURRENT_REQUEST_VALIDATION_FAILED(1008),
	
	/**
	 * The error that occurs when the users isn't found when he trying to log in.
	 */
	USER_NOT_FOUND(1009),
	
	/**
	 * The error that occurs when the password is incorrect
	 */
	INCORRECT_PASSWORD(1010),
	
	/**
	 * The error that occurs when the user inserts the same password as the old one
	 */
	PASSWORD_SAME_AS_OLD(1011),
	
	/**
	 * The error that occurs when the users isn't authenticated
	 */
	USER_NOT_AUTHENTICATED(1012),
	
	/**
	 * The error that occurs when the user is already confirmed
	 */
	USER_ALREADY_CONFIRMED(1013),
	
	/**
	 * The error that occurs when the token is expired
	 */
	TOKEN_EXPIRED(1014),
	
	/**
	 * The error that occurs when the token is invalid
	 */
	INVALID_TOKEN(1015);
	
	/**
	 * It represents the internal error code
	 */
	private final int internalErrorCode;
	/**
	 * It initializes the internalErrorCode with a specific value
	 * @param internalErrorCode  the internal error code that is associated with a specific error
	 */
	private InternalErrorCode(int internalErrorCode){
		this.internalErrorCode = internalErrorCode;
	}

}
