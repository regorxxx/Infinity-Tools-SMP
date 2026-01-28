ExactFile Console Application 1.0.1.6 BETA
Copyright 2009 StudyLamp Software LLC
www.ExactFile.com
No warranty expressed or implied.

**************************
USAGE
**************************

Usage: exf [OPTIONS] [HASH METHOD(s)] [FILE(s)]
  
  Options:
  -r         Recurse subdirectories
  -d PATH    Set working directory
  -otf FILE  Output to file instead of console (deletes file if exists)
  -c FILE    Use digest file to test files, report errors only
  -cv FILE   Use digest file to test files, verbose (report every file)
  -mt N      Set maximum hash threads to N

  -omd5      Output style: md5sum (default)
  -ofcmd5    Output style: FILECHECKMD5
  -osfv      Output style: Simple File Verification (defaults to -crc32 hash)
  -osha1     Output style: sha1sum (defaults to -sha1 hash)

  -fp        Output includes full paths.

  -md5sum    Same as <exf -r -otf exactfile.md5 -omd5 -md5 *.*>

  -license   Output exf EULA.

  Hash methods: (defaults to -md5, except for -osfv, -osha1)
  -adler32
  -crc32
  -md2
  -md4
  -md5
  -sha1
  -sha256
  -sha384
  -sha512
  -ripemd128
  -ripemd160
  -tiger128
  -tiger160
  -tiger192
  -gost

Notes:

  Maximum hash threads: exf defaults to 1 for written CD media. Otherwise, the
  number of processor cores is used, up to 16. exf will never use more than 16
  hash threads even if more is specified with -mt.

  When -c is specified, the working directory is set to the location of the
  digest file unless -d is specified.

  Using -otf will erase the output file specified if it already exists. Using
  this option ensures that the digest file being created will not be a part
  of the digest itself.

  -md5sum creates a digest file named "exactfile.md5" in the working directory,
  using the md5 hash method, with recursive subdirectory scanning of all files.
  Only -mt and -d are valid options when -md5sum is used.

  You can redirect console output to a file by appending > filename.txt to the
  command line. Note that if you redirect output to a file in the scanning
  path when creating a digest, and the file name matches the scanning file
  mask, an non-fatal error will be included in the digest file because exf
  will attempt to hash the output file while it is still being written.
  To avoid this, use the -otf FILE option.

  For more information on exf output formats see www.ExactFile.com.

Examples:

  exf -c sums.md5 -d C:\temp
    Tests files in digest file "sums.md5" (loads sums.md5 from current
    directory); assumes the files listed in the digest are in C:\temp.

  exf -c sums.md5
    Tests files in digest file "sums.md5"; assumes both the digest file and the
    files listed in the digest file are in the current directory.

  exf -c C:\temp\sums.md5
    Tests files in digest file "C:\temp\sums.md5"; assumes the files listed in
    the digest file are in the same folder as the digest file (C:\temp)

  exf -md5sum
    Creates a digest file in the current directory named "exactfile.md5" using
    the md5 hash method with recursive subdirectory scanning of all files of
    the current directory.

  exf -md5sum -d C:\temp
    Like above, but creates digest file "C:\temp\exactfile.md5" and scans files
    and subdirectories C:\temp

  exf -r -otf tempsums.md5 -d C:\temp *.txt *.exe
    Creates digest file "tempsums.md5" in C:\temp, scanning all of the files
    matching "*.txt" and "*.exe" in C:\temp and all subdirectories.

  exf -r -otf "C:\sums folder\tempsums.md5" -d C:\temp *.txt *.exe
    Same as above, but writes digest file to "C:\sums folder" instead.

  exf -crc32 -sha1 -md5 -gost myfile.zip
    Output CRC32, SHA1, MD5, and GOST hashes for myfile.zip in the current
    directory. Uses md5sum output format.

**************************
EULA
**************************

ExactFile (exf Freeware Console Application)
Copyright 2009 StudyLamp Software LLC
http://www.ExactFile.com

IMPORTANT--READ THESE TERMS CAREFULLY BEFORE INSTALLING OR USING
THIS SOFTWARE. BY INSTALLING OR USING THIS SOFTWARE, YOU
ACKNOWLEDGE THAT YOU HAVE READ THIS LICENSE AGREEMENT, THAT YOU
UNDERSTAND IT, AND THAT YOU AGREE TO BE BOUND BY ITS TERMS. IF
YOU DO NOT AGREE TO THE TERMS AND CONDITIONS OF THIS LICENSE
AGREEMENT, PROMPTLY EXIT WITHOUT INSTALLING, USING, OR PURCHASING
THE SOFTWARE.

1. Grant of License
StudyLamp Software LLC (the "AUTHOR") grants you a
non-exclusive, non-transferable license to use the program with
which this license is distributed (the "PRODUCT," "SOFTWARE,"
"PROGRAM"), including any documentation files accompanying the
Software ("User Guide") provided that: (i) the Software is
installed on only in accordance with this License; (ii) the
Software is NOT modified; (iii) all copyright notices are
maintained on the Software; and (iv) you agree to be bound by the
terms of this License Agreement. 

2. Ownership 
You have no ownership rights in the Software. Rather, you have a
license to use the Software as long as this License Agreement
remains in full force and effect. Ownership of the Software,
Documentation and all intellectual property rights therein shall
remain at all times with the Author.

3. Copyright 
The Software and Documentation contain material that is
protected by United States Copyright Law and trade secret law,
and by international treaty provisions. All rights not granted to
you herein are expressly reserved by the Author. You may not
remove any proprietary notice of the Author from any copy of the
Software or Documentation. 

4. Restrictions 
You may not publish, display, disclose, rent, lease, modify,
loan, distribute, or create derivative works based on the
Software or any part thereof. You may not reverse engineer,
decompile, translate, adapt, or disassemble the Software, nor
shall you attempt to create the source code from the object code
for the Software. 

5. Limited Warranty 
ANY USE BY YOU OF THE SOFTWARE IS AT YOUR OWN RISK. THE SOFTWARE
IS PROVIDED "AS IS." TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE
AUTHOR DISCLAIMS ALL WARRANTIES OF ANY KIND, EITHER EXPRESSED OR
IMPLIED, INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE AUTHOR
DOES NOT WARRANT THAT THE FUNCTIONS CONTAINED IN THE SOFTWARE
WILL MEET ANY REQUIREMENTS OR NEEDS YOU MAY HAVE, OR THAT THE
SOFTWARE WILL OPERATE ERROR FREE, OR IN AN UNINTERRUPTED FASHION,
OR THAT ANY DEFECTS OR ERRORS IN THE SOFTWARE WILL BE CORRECTED,
OR THAT THE SOFTWARE IS COMPATIBLE WITH ANY PARTICULAR PLATFORM.

6. Limitation of Liability 
IN NO EVENT WILL THE AUTHOR BE LIABLE TO YOU OR ANY THIRD PARTY
FOR ANY INCIDENTAL OR CONSEQUENTIAL DAMAGES (INCLUDING, WITHOUT
LIMITATION, INDIRECT, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES FOR
LOSS OF BUSINESS, LOSS OF PROFITS, BUSINESS INTERRUPTION, OR LOSS
OF BUSINESS INFORMATION) ARISING OUT OF THE USE OF OR INABILITY
TO USE THE PROGRAM, OR FOR ANY CLAIM BY ANY OTHER PARTY, EVEN IF
THE AUTHOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
THE AUTHOR'S AGGREGATE LIABILITY WITH RESPECT TO ITS OBLIGATIONS
UNDER THIS AGREEMENT OR OTHERWISE WITH RESPECT TO THE SOFTWARE
AND DOCUMENTATION OR OTHERWISE SHALL NOT EXCEED THE AMOUNT OF THE
LICENSE FEE PAID BY YOU FOR THE SOFTWARE AND DOCUMENTATION.

7. Termination 
This License Agreement is effective until it is terminated. You
may terminate this License Agreement at any time by destroying or
returning to the Author all copies of the Software and
Documentation in your possession or under your control. The
Author may terminate this License Agreement for any reason,
including, but not limited to, if the Author finds that you have
violated any of the terms of this License Agreement. Upon
notification of termination, you agree to destroy or return to
the Author all copies of the Software and Documentation. All
provisions relating to confidentiality, proprietary rights, and
non-disclosure shall survive the termination of this Software
License Agreement. 

8. General 
This License Agreement shall be construed, interpreted and
governed by the laws of the United States without regard to
conflicts of law provisions thereof. The exclusive forum for any
disputes arising out of or relating to this License Agreement
shall be an appropriate court sitting in Oklahoma, United States.
This License Agreement shall constitute the entire Agreement
between the parties hereto. Any waiver or modification of this
License Agreement shall only be effective if it is in writing and
signed by both parties hereto. If any part of this License
Agreement is found invalid or unenforceable by a court of
competent jurisdiction, the remainder of this License Agreement
shall be interpreted so as to reasonably effect the intention of
the parties. 

**************************
REVISION HISTORY
**************************

exf 1.0.1.6 BETA

 * Fixed problem that caused batch files to terminate with exf.
   This was caused by the way Windows consoles handle changing
   of the output code page. 
   exf now reverts the console output code page to the pre-
   existing code page setting when exf finishes. This means that
   Unicode characters will appear as squares on the screen, but
   redirected output (such as to a file) does not lose data, so
   this is okay.
 * Minor performance improvement.

exf 1.0.0.4 BETA

 * Changed SHA1 style output and digest input scanning to be
   compatible with GNU sha1sum.

exf 1.0.0.3 BETA

 * Adjustments to file reading code.
 * Fixed hidden files not getting scanned.
 * Added -fp switch to include full path in digest output.
 * Console output includes number of files hashed.

exf 1.0.0.1 BETA

 * Initial release.