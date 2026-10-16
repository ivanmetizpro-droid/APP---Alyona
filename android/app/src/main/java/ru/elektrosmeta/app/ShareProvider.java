package ru.elektrosmeta.app;
import android.content.*;
import android.database.*;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.*;
/** Narrow read-only content provider, usable only with temporary URI grants. */
public final class ShareProvider extends ContentProvider {
 public boolean onCreate(){return true;}
 private File file(Uri uri)throws FileNotFoundException{try{if(!"ru.elektrosmeta.app.files".equals(uri.getAuthority())||uri.getPathSegments().size()!=1)throw new IOException();File root=new File(getContext().getCacheDir(),"shared").getCanonicalFile();File f=new File(root,uri.getLastPathSegment()).getCanonicalFile();if(!root.equals(f.getParentFile())||!f.isFile()||!f.getName().endsWith(".pdf"))throw new IOException();return f;}catch(IOException e){throw new FileNotFoundException();}}
 public String getType(Uri uri){return "application/pdf";}
 public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{if(!"r".equals(mode))throw new FileNotFoundException("Read only");return ParcelFileDescriptor.open(file(uri),ParcelFileDescriptor.MODE_READ_ONLY);}
 public Cursor query(Uri uri,String[] projection,String selection,String[] args,String sort){try{File f=file(uri);String[] cols=projection==null?new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE}:projection;MatrixCursor c=new MatrixCursor(cols);Object[] row=new Object[cols.length];for(int i=0;i<cols.length;i++)row[i]=OpenableColumns.DISPLAY_NAME.equals(cols[i])?f.getName():OpenableColumns.SIZE.equals(cols[i])?f.length():null;c.addRow(row);return c;}catch(FileNotFoundException e){return null;}}
 public Uri insert(Uri uri,ContentValues values){throw new UnsupportedOperationException();}public int delete(Uri uri,String s,String[] args){throw new UnsupportedOperationException();}public int update(Uri uri,ContentValues v,String s,String[] args){throw new UnsupportedOperationException();}
}
