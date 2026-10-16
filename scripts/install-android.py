#!/usr/bin/env python3
"""Install pinned official SDK archives, checking Google's published SHA-1."""
import pathlib, subprocess, hashlib, zipfile, shutil, xml.etree.ElementTree as ET
root=pathlib.Path('/workspace/toolchains'); sdk=root/'android-sdk';root.mkdir(exist_ok=True)
repo=root/'android-repository.xml'
subprocess.run(['curl','-fL','--retry','2','https://dl.google.com/android/repository/repository2-1.xml','-o',str(repo)],check=True)
xml=ET.parse(repo).getroot()
for package,filename,dest in [('platforms;android-34','platform-34-ext7_r03.zip','platforms/android-34'),('build-tools;34.0.0','build-tools_r34-linux.zip','build-tools/34.0.0'),('platform-tools','platform-tools_r37.0.1-linux.zip','platform-tools')]:
 archive=None
 for p in xml.findall('remotePackage'):
  if p.attrib['path']==package:
   for a in p.findall('archives/archive'):
    if a.findtext('complete/url')==filename: archive=a
 if archive is None: raise RuntimeError('Pinned archive not listed by Google: '+filename)
 file=root/filename
 checksum=archive.findtext('complete/checksum')
 if not file.exists() or hashlib.sha1(file.read_bytes()).hexdigest()!=checksum:
  subprocess.run(['curl','-fL','--retry','2','https://dl.google.com/android/repository/'+filename,'-o',str(file)],check=True)
 if hashlib.sha1(file.read_bytes()).hexdigest()!=checksum: raise RuntimeError('Checksum mismatch')
 target=sdk/dest
 if not target.exists():
  temp=root/('extract-'+filename);temp.mkdir(exist_ok=True)
  with zipfile.ZipFile(file) as z:
   for i in z.infolist():
    assert '..' not in pathlib.PurePosixPath(i.filename).parts
    z.extract(i,temp)
    if i.external_attr>>16: (temp/i.filename).chmod((i.external_attr>>16)&0o777)
  dirs=list(temp.iterdir());assert len(dirs)==1
  target.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(dirs[0]),target);shutil.rmtree(temp)
 print('Verified',package,filename,checksum)
