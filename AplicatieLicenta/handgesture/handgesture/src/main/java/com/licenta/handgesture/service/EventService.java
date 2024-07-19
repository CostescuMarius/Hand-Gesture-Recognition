package com.licenta.handgesture.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.licenta.handgesture.dto.EmailInfo;
import com.licenta.handgesture.events.RegistrationEvent;
import com.licenta.handgesture.exception.EmailException;
import com.licenta.handgesture.model.User;
import com.licenta.handgesture.type.EmailTemplateData;
import com.licenta.handgesture.type.EmailType;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;

/**
 * Service class for handling events.
 */
@Service
@AllArgsConstructor
public class EventService {
	
	/**
	 * The email service responsible for sending email.
	 */
    private final EmailService emailService;
    
    /**
     * The JWT (JSON Web Token) service used for generating email confirmation tokens.
     */
    private final JwtService jwtService;

    /**
     * Event listener method for handling user registration events.
     *
     * @param event The RegistrationEvent containing user registration information.
     */
    @EventListener
    public void handleUserRegistration(RegistrationEvent event) {
    	User newUser = event.getUser();     
        
        Map<String, Object> emailData = new HashMap<>();
        emailData.put(EmailTemplateData.NAME.getName(), newUser.getName());
        
        String token = jwtService.generateEmailConfirmationToken(newUser.getId(), newUser.getRegistrationDate());
		emailData.put(EmailTemplateData.TOKEN.getName(), token);
		
		HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
	    String baseUrl = ServletUriComponentsBuilder.fromRequestUri(request)
	    		.replacePath(null)
	    		.build()
	    		.toUriString();
	    emailData.put(EmailTemplateData.BASEURL.getName(), baseUrl);
		
        try {
        	/**
        	 * Object containing information about the email.
        	 */
            EmailInfo emailInfo = new EmailInfo();
            emailInfo.setType(EmailType.CONFIRM_REGISTRATION);
            emailInfo.setEmailAddress(newUser.getEmail());
    		emailInfo.setEmailData(emailData);
    		
        	emailService.sendEmail(emailInfo);
		} catch (EmailException e) {
			System.err.println("Could not send registration email!");
		}
    }
}
