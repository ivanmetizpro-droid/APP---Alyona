package ru.elektrosmeta.app;

import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.*;
import android.util.Base64;
import android.webkit.*;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.util.*;
import org.json.JSONObject;

/** Local resources only. The JS bridge never shares an origin with remote content. */
public final class MainActivity extends Activity {
 private static final String HOST="appassets.androidplatform.net", START="https://"+HOST+"/assets/index.html";
 private static final int SAVE=41, IMPORT=42, LIMIT=20*1024*1024;
 private WebView web; private byte[] pending; private String pendingMime;
 @Override public void onCreate(Bundle b){super.onCreate(b);
  web=new WebView(this);setContentView(web);WebView.setWebContentsDebuggingEnabled(false);
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);
  s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setAllowFileAccessFromFileURLs(false);s.setAllowUniversalAccessFromFileURLs(false);
  s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setJavaScriptCanOpenWindowsAutomatically(false);s.setSupportMultipleWindows(false);s.setSafeBrowsingEnabled(true);s.setMediaPlaybackRequiresUserGesture(true);
  android.webkit.CookieManager.getInstance().setAcceptCookie(false);
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){Uri u=request.getUrl();
    if(!"https".equals(u.getScheme())||!HOST.equals(u.getHost())||u.getPort()!=-1||!"GET".equals(request.getMethod()))return denied();
    String path=u.getPath();if(path==null||!path.startsWith("/assets/")||path.contains("..")||path.contains("\\"))return denied();
    path=path.substring(8);if(path.isEmpty())path="index.html";
    String mime=path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".html")?"text/html":path.endsWith(".ttf")?"font/ttf":path.endsWith(".svg")?"image/svg+xml":path.endsWith(".png")?"image/png":path.endsWith(".webmanifest")?"application/manifest+json":"application/octet-stream";
    try{Map<String,String> headers=new HashMap<>();headers.put("X-Content-Type-Options","nosniff");headers.put("Cache-Control","no-cache");return new WebResourceResponse(mime,"UTF-8",200,"OK",headers,getAssets().open("www/"+path));}catch(IOException e){return denied();}
   }
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){Uri u=request.getUrl();if("https".equals(u.getScheme())&&HOST.equals(u.getHost())&&u.getPort()==-1&&"/assets/index.html".equals(u.getPath()))return false;
    if(request.isForMainFrame()&&request.hasGesture()&&("https".equals(u.getScheme())||"http".equals(u.getScheme()))){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(ActivityNotFoundException e){result("error","Нет браузера для ссылки");}}return true;}
  });
  web.setWebChromeClient(new WebChromeClient());web.addJavascriptInterface(new Bridge(),"Android");web.loadUrl(START);
  File dir=new File(getCacheDir(),"shared");File[] files=dir.listFiles();if(files!=null)for(File f:files)if(System.currentTimeMillis()-f.lastModified()>86400000L)f.delete();
 }
 private WebResourceResponse denied(){return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 private boolean local(){String u=web.getUrl();return u!=null&&(u.equals(START)||u.startsWith(START+"#"));}
 private void result(String status,String message){web.evaluateJavascript("window.onNativeResult&&window.onNativeResult("+JSONObject.quote(status)+","+JSONObject.quote(message)+")",null);}
 public final class Bridge {
  @JavascriptInterface public void exportFile(String name,String mime,String base64,String action){runOnUiThread(()->{
   if(!local())return;if(pending!=null){result("error","Завершите предыдущее сохранение");return;}
   try{if(base64==null||base64.length()>LIMIT*4/3+8||!("application/pdf".equals(mime)||"application/json".equals(mime)))throw new IOException("Неподдерживаемый файл или размер");
    byte[] bytes=Base64.decode(base64,Base64.DEFAULT);if(bytes.length>LIMIT)throw new IOException("Файл больше 20 МБ");String safe=name.replaceAll("[^a-zA-Z0-9._-]","_");if(safe.length()>120)safe=safe.substring(0,120);
    if("share".equals(action)&&"application/pdf".equals(mime)){
     File dir=new File(getCacheDir(),"shared");if(!dir.exists()&&!dir.mkdirs())throw new IOException("Ошибка кеша");File file=new File(dir,UUID.randomUUID()+"_"+safe);try(FileOutputStream out=new FileOutputStream(file)){out.write(bytes);}
     Uri uri=new Uri.Builder().scheme("content").authority("ru.elektrosmeta.app.files").appendPath(file.getName()).build();Intent share=new Intent(Intent.ACTION_SEND).setType(mime).putExtra(Intent.EXTRA_STREAM,uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);share.setClipData(ClipData.newUri(getContentResolver(),safe,uri));startActivity(Intent.createChooser(share,"Поделиться PDF"));result("info","Открыто меню «Поделиться». Получение документа не подтверждено.");
    }else{pending=bytes;pendingMime=mime;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE,safe);startActivityForResult(intent,SAVE);}
   }catch(Exception e){pending=null;pendingMime=null;result("error","Не удалось открыть сохранение / отправку");}
  });}
  @JavascriptInterface public void importBackup(){runOnUiThread(()->{if(!local())return;try{startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json"),IMPORT);}catch(Exception e){result("error","Не удалось открыть выбор файла");}});}
 }
 @Override protected void onActivityResult(int request,int code,Intent data){super.onActivityResult(request,code,data);if(request!=SAVE&&request!=IMPORT)return;
  if(code!=RESULT_OK||data==null||data.getData()==null){pending=null;pendingMime=null;result("cancel","");return;}
  Uri uri=data.getData();try{
   if(request==SAVE){if(pending==null)throw new IOException("Данные сохранения потеряны; повторите экспорт");try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new IOException();out.write(pending);}result("saved","Файл сохранён");}
   else{ByteArrayOutputStream out=new ByteArrayOutputStream();try(InputStream in=getContentResolver().openInputStream(uri)){if(in==null)throw new IOException();byte[] buf=new byte[8192];int n,total=0;while((n=in.read(buf))!=-1){total+=n;if(total>LIMIT)throw new IOException("Файл больше 20 МБ");out.write(buf,0,n);}}String encoded=Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP);web.evaluateJavascript("window.onNativeImport&&window.onNativeImport("+JSONObject.quote(encoded)+")",null);}
  }catch(Exception e){result("error","Не удалось прочитать или сохранить файл. Данные приложения сохранены.");}finally{pending=null;pendingMime=null;}
 }
 @Override public void onBackPressed(){web.evaluateJavascript("Boolean(window.handleNativeBack&&window.handleNativeBack())",value->{if(!"true".equals(value))new AlertDialog.Builder(this).setMessage("Закрыть Электросмету? Данные сохранены на устройстве.").setNegativeButton("Остаться",null).setPositiveButton("Закрыть",(d,w)->finish()).show();});}
 @Override protected void onDestroy(){web.removeJavascriptInterface("Android");web.destroy();super.onDestroy();}
}
