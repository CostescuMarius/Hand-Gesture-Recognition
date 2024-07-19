package com.licenta.handgesture.exception;

import java.util.List;

import org.springframework.http.HttpStatus;

import com.licenta.handgesture.messages.Message;

import lombok.Getter;

/**
 *  This class represents an exception that encapsulates multiple error messages and corresponding IDs
 */
@Getter
public class MultipleAccountException extends AccountException {

	/**
	 * Unique ID used in serialization to verify that the sender and receiver of a serialized object maintain compatibility.
	 */
	private static final long serialVersionUID = 1L; 

	/**
	 *  A list of InputValidationError objects that represent the specific validation errors
	 */
	private final transient List<InputValidationError> fieldErrors;

	/**
	 * Constructs a MultipleAccountException with the specified details
	 * 
	 * @param fieldErrors The list of InputValidationError objects associated with this exception.
	 */
	public MultipleAccountException(List<InputValidationError> fieldErrors) {
		super(Message.INPUT_VALIDATION_FAILED, HttpStatus.UNPROCESSABLE_ENTITY, InternalErrorCode.THE_CURRENT_REQUEST_VALIDATION_FAILED);
		this.fieldErrors = fieldErrors;
	}
}
