package com.oracle.determinations.mobile;
import java.io.IOException;
import java.io.InputStream;

import oracle.adfmf.amx.event.ActionEvent;

import oracle.adfmf.framework.exception.AdfException;

import org.apache.commons.io.IOUtils;

public class IntegrationBean {
	public IntegrationBean() {
	}

	public void handleLaunchInterview(ActionEvent evt) {
		try {
			ClassLoader cl = Thread.currentThread().getContextClassLoader();
			InputStream is1 = cl.getResourceAsStream(".adf/META-INF/GOVUK-OPA-Mobile-Demo.zip");
			InterviewRuntime.startInterview("GOVUK-OPA-Mobile-Demo", IOUtils.toByteArray(is1));
		} catch (IOException ex) {
			throw new AdfException("Error loading Mobile Demo policy model", AdfException.ERROR);
		}
	}
}