package com.ranjit.projects.Taskly.service;

import com.ranjit.projects.Taskly.dto.subscription.CheckoutRequest;
import com.ranjit.projects.Taskly.dto.subscription.CheckoutResponse;
import com.ranjit.projects.Taskly.dto.subscription.PortalResponse;
import com.stripe.model.StripeObject;

import java.util.Map;

public interface PaymentProcessor {


    CheckoutResponse createCheckoutSessionUrl(CheckoutRequest request);

    PortalResponse openCustomerPortal();

    void handleWebhookEvent(String type, StripeObject stripeObject, Map<String, String> metadata);

}
