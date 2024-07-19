package com.licenta.handgesture.service;

import java.sql.Timestamp;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.licenta.handgesture.config.ApplicationPropertiesConfig;
import com.licenta.handgesture.dto.ChangePasswordDto;
import com.licenta.handgesture.dto.DeleteUserDto;
import com.licenta.handgesture.dto.UpdateUserNameDto;
import com.licenta.handgesture.events.RegistrationEvent;
import com.licenta.handgesture.exception.InternalErrorCode;
import com.licenta.handgesture.exception.AccountException;
import com.licenta.handgesture.exception.UserNotAuthenticatedException;
import com.licenta.handgesture.messages.Message;
import com.licenta.handgesture.model.User;
import com.licenta.handgesture.model.UserStatus;
import com.licenta.handgesture.repository.UserRepository;
import com.licenta.handgesture.type.TokenClaim;
import com.licenta.handgesture.utility.DateUtility;

import io.jsonwebtoken.Claims;
import lombok.AllArgsConstructor;

/**
 *  Service class for user-related operations.
 */
@Service
@AllArgsConstructor
public class UserService {
	private final ApplicationEventPublisher eventPublisher;
	
	private static final long MILIS_IN_DAY = 24L * 60L * 60L * 1000L;
	
	/**
	 * Instance of UserRepository to interact with the database.
	 */
	@Autowired
	private UserRepository userRepository;
	
	/**
	 * Instance of BCryptPasswordEncoder used for encoding the password
	 */
	@Autowired
	private PasswordEncoder passwordEncoder;
	
	@Autowired
	private JwtService jwtService;
	
	@Autowired
	private ApplicationPropertiesConfig accountProperties;
	
	/**
	 * Register a new user in the system.
	 * 
	 * @param newUser The new User entity to be registered.
	 * @return The registered User entity
	 * @throws AccountException If a user with the same email already exists.
	 */
	public com.licenta.handgesture.model.User registerUser(User newUser) {
				
		if(userRepository.existsByEmail(newUser.getEmail())) {
            throw new AccountException(Message.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT, InternalErrorCode.EMAIL_ALREADY_EXISTS);
        }
		
		newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
		newUser.setRegistrationDate(DateUtility.getCurrentUTCTimestamp());
		newUser.setStatus(UserStatus.NEW.getStatus());
		
		newUser = userRepository.save(newUser);
		
		eventPublisher.publishEvent(new RegistrationEvent(this, newUser));
		
		return newUser;
	}
	
	
	/**
	 *  Retrieves a User entity based on the provided email from the database.
	 *  
	 * @param email The email of the User entity to retrieve.
	 * @return A User entity that matches the provided email, or null if no matching User entity is found.
	 */
	public User getUserByEmail(String email) {
		return userRepository.findByEmail(email);
	}
	
	/**
	 * Saves or updates the given user entity in the repository.
	 * 
	 * @param user the user entity to be saved or updated.
	 * @return the saved or updated user entity.
	 */
	public User updateUser(User user) {
		return userRepository.save(user);
	}
	
	/**
	 * Retrieves the currently authenticated user from the security context.
	 * 
	 * @return The authenticated User entity.
	 */
	public User getCurrentUser() {
		
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		
		if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User userPrincipal) {
		        return userRepository.findByEmail(userPrincipal.getUsername());
		}
		
		throw new UserNotAuthenticatedException();
	}
	
	/**
     * Updates the name of the user identified by the given email.
     * 
     * @param email the email address used to identify the user.
     * @param newName the new name to be set for the user.
     * @return the updated user entity.
     */
	public User updateCurrentUserName( UpdateUserNameDto newName) {
		User currentUser = getCurrentUser();
	    currentUser.setName(newName.getName());
	    userRepository.save(currentUser);
	    return currentUser;
	}
	
	/**
	 * Updates the password of the currently authenticated user after validating the input data.
	 * 
	 * @param changePasswordDto Data transfer object containing details about the old and new passwords.
	 * @return A UserDto representation of the user after the password has been updated.
	 */
	public User updateCurrentUserPassword(ChangePasswordDto changePasswordDto) {
		User currentUser = getCurrentUser();
		
		 if (!passwordEncoder.matches(changePasswordDto.getOldPassword(), currentUser.getPassword())) {
			throw new AccountException(Message.INCORRECT_PASSWORD, HttpStatus.FORBIDDEN, InternalErrorCode.INCORRECT_PASSWORD);
			
		} else if (changePasswordDto.getOldPassword().equals(changePasswordDto.getNewPassword())) {
			throw new AccountException(Message.PASSWORD_SAME_AS_OLD, HttpStatus.FORBIDDEN, InternalErrorCode.PASSWORD_SAME_AS_OLD);
		}
		 currentUser.setPassword(passwordEncoder.encode(changePasswordDto.getNewPassword()));
		 
		 return userRepository.save(currentUser);
	}
	
	/**
	 * Deletes the currently authenticated user by updating their status to "deleted" and setting their deletion date to the current timestamp.
	 * 
	 * @param deleteUserDto Data transfer object containing the password of the user to be deleted.
	 * @return The updated user entity with the "deleted" status and the current timestamp as the deletion date.
	 */
	public User deleteUser(DeleteUserDto deleteUserDto) {
        User currentUser = getCurrentUser();

        if (!passwordEncoder.matches(deleteUserDto.getPassword(), currentUser.getPassword())) {
            throw new AccountException(Message.INCORRECT_PASSWORD, HttpStatus.FORBIDDEN, InternalErrorCode.INCORRECT_PASSWORD);
        }
        
        currentUser.setStatus(UserStatus.DELETED.getStatus());
        
        currentUser.setDeletionDate(DateUtility.getCurrentUTCTimestamp());
        
        return userRepository.save(currentUser);
    }
	
	/**
	 * Recovers the currently authenticated user by updating their status to "active" and setting their deletion date to null.
	 * 
	 * @return The updated user entity with the "active" status and set null the deletion date.
	 */
	public User recoverUser() {
        User currentUser = getCurrentUser();

        currentUser.setStatus(UserStatus.ACTIVE.getStatus());
        currentUser.setDeletionDate(null);
        
        return userRepository.save(currentUser);
    }
	
	/**
	 * This method is responsible for confirming the user registration through a given token.
	 * 
	 * @param token A String representing the token used for confirming user registration.
	 * @return User object representing the confirmed user with updated status.
	 * @throws  AccountException if the token is invalid, expired, or the user is already active
	 */
	public User confirmUserRegistration(String token) {
		Claims claims;

		try {
			claims = jwtService.parseToken(token);
		} catch (Exception e) {
			throw new AccountException(Message.INVALID_TOKEN, HttpStatus.BAD_REQUEST, InternalErrorCode.INVALID_TOKEN);
		}

		Integer userId = claims.get(TokenClaim.USER_ID.getName(), Integer.class);
		Date creationDate = claims.get(TokenClaim.CREATION_DATE.getName(), Date.class);

		if (userId == null || creationDate == null) {
			throw new AccountException(Message.INVALID_TOKEN, HttpStatus.BAD_REQUEST, InternalErrorCode.INVALID_TOKEN);
		}

		Timestamp currentDate = DateUtility.getCurrentUTCTimestamp();
		long differenceDays = Math.abs(currentDate.getTime() - creationDate.getTime())/MILIS_IN_DAY;

		if(differenceDays >= accountProperties.getDaysForEmailConfirmation()) {
			throw new AccountException(Message.TOKEN_EXPIRED, HttpStatus.GONE, InternalErrorCode.TOKEN_EXPIRED);
		}

		User user = userRepository.findById((int) userId);

		if (UserStatus.ACTIVE.getStatus().equals(user.getStatus())) {
			throw new AccountException(Message.USER_ALREADY_CONFIRMED, HttpStatus.GONE, InternalErrorCode.USER_ALREADY_CONFIRMED);
    	} 
        
        user.setStatus(UserStatus.ACTIVE.getStatus());
        
        return userRepository.save(user);
	}
}
