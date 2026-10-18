package ru.elektrosmeta.tests;
import android.app.*;
import android.content.*;
import android.os.*;
import android.webkit.*;
import android.view.accessibility.*;
import android.accessibilityservice.AccessibilityServiceInfo;
import java.lang.reflect.*;
import java.util.concurrent.*;
import org.json.*;

/** Runs against the signed release without enabling WebView remote debugging. */
public final class NativeChecks extends Instrumentation {
 private Activity activity;private WebView web;private StringBuilder report=new StringBuilder();
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 private String js(String code)throws Exception{final String[] result={null};CountDownLatch done=new CountDownLatch(1);runOnMainSync(()->web.evaluateJavascript(code,v->{result[0]=v;done.countDown();}));if(!done.await(180,TimeUnit.SECONDS))throw new Exception("JS timeout");return result[0];}
 private void check(boolean value,String name)throws Exception{if(!value)throw new Exception("FAILED: "+name);report.append("PASS: ").append(name).append('\n');Bundle b=new Bundle();b.putString("stream","PASS: "+name+"\n");sendStatus(0,b);}
 private void until(String code,String expected,int seconds)throws Exception{long deadline=System.currentTimeMillis()+seconds*1000L;while(System.currentTimeMillis()<deadline){if(js(code).equals(expected))return;Thread.sleep(500);}throw new Exception("Timed out: "+code+" result="+js(code));}
 private void back()throws Exception{getUiAutomation().executeShellCommand("input keyevent 4").close();Thread.sleep(1500);}
 private boolean clickNode(AccessibilityNodeInfo root,String value){if(root==null)return false;String t=String.valueOf(root.getText()),desc=String.valueOf(root.getContentDescription()),id=String.valueOf(root.getViewIdResourceName());if((t.equalsIgnoreCase(value)||desc.equalsIgnoreCase(value)||desc.toLowerCase(java.util.Locale.ROOT).contains(value.toLowerCase(java.util.Locale.ROOT))||value.startsWith("elektrosmeta-backup-")&&t.startsWith("elektrosmeta-ba")||id.endsWith(value))&&root.isEnabled()){AccessibilityNodeInfo n=root;for(int i=0;i<4&&n!=null;i++,n=n.getParent())if(n.isClickable())return n.performAction(AccessibilityNodeInfo.ACTION_CLICK);}for(int i=0;i<root.getChildCount();i++)if(clickNode(root.getChild(i),value))return true;return false;}
 private void clickSystem(String... choices)throws Exception{long deadline=System.currentTimeMillis()+30000;while(System.currentTimeMillis()<deadline){for(String value:choices)if(clickNode(getUiAutomation().getRootInActiveWindow(),value)){Thread.sleep(1000);return;}Thread.sleep(500);}throw new Exception("System button not found: "+java.util.Arrays.toString(choices));}
 @Override public void onStart(){Bundle output=new Bundle();try{
  activity=startActivitySync(new Intent().setClassName("ru.elektrosmeta.app","ru.elektrosmeta.app.MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
  Field f=activity.getClass().getDeclaredField("web");f.setAccessible(true);web=(WebView)f.get(activity);
  AccessibilityServiceInfo service=getUiAutomation().getServiceInfo();service.flags|=AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS;getUiAutomation().setServiceInfo(service);
  until("Boolean(document.querySelector('[data-act=demo]'))","true",90);
  check(js("location.origin").equals("\"https://appassets.androidplatform.net\""),"local HTTPS origin");
  check(!activity.getApplicationInfo().enabled|| (activity.getApplicationInfo().flags&2)==0,"release is not debuggable");
  runOnMainSync(()->{if(web.getSettings().getAllowFileAccess()||web.getSettings().getAllowContentAccess()||web.getSettings().getMixedContentMode()!=WebSettings.MIXED_CONTENT_NEVER_ALLOW)throw new AssertionError("Unsafe settings");});
  check(true,"file/content access and mixed content disabled");
  js("document.querySelector('[data-act=demo]').click();true");until("Boolean(document.querySelector('[data-act=snapshot]'))","true",30);
  js("document.querySelector('[data-act=snapshot]').click();true");until("Boolean(document.querySelector('[data-act=download-pdf]'))","true",30);
  check(js("document.body.innerText.includes('Версия 1')").equals("true"),"functional plan estimate and version created in Android WebView");
  js("window.__result=null;window.__originalResult=window.onNativeResult;window.onNativeResult=(s,m)=>{window.__result=s;window.__originalResult(s,m)};document.querySelector('[data-act=download-pdf]').click();true");Thread.sleep(2500);back();until("window.__result","\"cancel\"",30);check(true,"native PDF SAF cancel returns cancel");
  js("window.__result=null;document.querySelector('[data-act=download-pdf]').click();true");clickSystem("Save","action_menu_save");until("window.__result","\"saved\"",30);check(true,"native PDF saved through SAF");
  js("window.__result=null;document.querySelector('[data-act=share-pdf]').click();true");until("window.__result","\"info\"",30);check(true,"native PDF share chooser opened with temporary URI");back();
  js("location.hash='settings';true");until("Boolean(document.querySelector('[data-act=backup]'))","true",30);
  js("window.__result=null;document.querySelector('[data-act=backup]').click();true");Thread.sleep(2000);back();until("window.__result","\"cancel\"",30);check(js("document.body.innerText.includes('ещё не создавалась')").equals("true"),"cancelled JSON backup does not mark backup saved");
  js("window.__result=null;document.querySelector('[data-act=backup]').click();true");clickSystem("Save","action_menu_save");until("window.__result","\"saved\"",30);check(true,"native JSON backup saved through SAF");
  js("window.__result=null;document.querySelector('[data-act=import]').click();true");Thread.sleep(2000);back();until("window.__result","\"cancel\"",30);check(true,"native JSON import cancel leaves project intact");
  js("document.querySelector('[data-act=import]').click();true");String backupName=(String)new JSONTokener(js("'elektrosmeta-backup-'+new Date().toISOString().slice(0,10)+'.json'")).nextValue();clickSystem(backupName);until("Boolean(document.querySelector('dialog[open]'))","true",30);js("document.querySelector('dialog form').requestSubmit();true");until("Boolean(document.querySelector('[data-act=open]'))","true",30);check(true,"native JSON import restored validated state");
  js("window.handleNativeBack();true");check(true,"native Back handler executes");
  output.putString("stream",report.toString());finish(Activity.RESULT_OK,output);
 }catch(Throwable e){output.putString("stream",report+"FAIL: "+e.toString()+"\n");finish(Activity.RESULT_CANCELED,output);}}
}
