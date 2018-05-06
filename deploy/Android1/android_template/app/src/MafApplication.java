/* Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved. */
package com.govuk.mobile.opa;

import android.content.Context;
import android.os.Build;

import oracle.adfmf.Application;

public class MafApplication
  extends Application
{
  @Override
  public boolean isDebug()
  {
    return BuildConfig.DEBUG;
  }
  
  @Override
  public String getApplicationId()
  {
    return BuildConfig.APPLICATION_ID;
  }

  @Override
  public String getBuildType()
  {
    return BuildConfig.BUILD_TYPE;
  }
  
  @Override
  public String getFlavor()
  {
    return BuildConfig.FLAVOR;
  }
  
  @Override
  public int getVersionCode()
  {
    return BuildConfig.VERSION_CODE;
  }
  
  @Override
  public String getVersionName()
  {
    return BuildConfig.VERSION_NAME;
  }

  @Override
  public boolean isStrictMode()
  {
    return BuildConfig.STRICT_MODE;
  }
  
  @Override
  public boolean isMultiDex()
  {
    return BuildConfig.MULTI_DEX;
  }
  
  @Override
  protected void attachBaseContext(Context context)
  {
    super.attachBaseContext(context);

    //
    // Perform the multi-dex installation, if needed.
    //
    MultiDexInstaller.install(this);
  }
}
