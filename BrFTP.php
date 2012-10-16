<?php

/**
 * Project:     Breeze framework
 * Author:      Jager Mesh (jagermesh@gmail.com)
 *
 * @version 1.1.0.0
 * @package Breeze Core
 */

require_once(__DIR__.'/BrObject.php');
require_once(__DIR__.'/BrFileSystem.php');

class BrFTPFileObject {

  private $name;
  private $size;
  private $isDirectory;

  function __construct($line) {

    if (preg_match('#([-d]).* ([0-9]+) ([a-zA-Z]{3}) ([ 0-9]?[0-9]) ([0-9]{2}):([0-9]{2}) (.+)#', $line, $matches)) {
      $this->isDirectory = ($matches[1] == 'd');
      $this->size = $matches[2];
      $this->name = $matches[7];
    }

  }

  function isFile() {

    return !$this->isDir();

  }

  function isDir() {

    return $this->isDirectory;

  }

  function name() {

    return $this->name;

  }

  function size() {

    return $this->size;

  }

}

class BrFTP extends BrObject {

  private $connectionId;
  private $currentDirectory = '/';
  private $currentHostName;
  private $currentUserName;
  private $currentPassword;
  private $currentPassiveMode;

  function __construct() {

    parent::__construct();

  }
  
  function connect($hostName, $userName, $password, $passiveMode = true) {

    $this->currentHostName = $hostName;
    $this->currentUserName = $userName;
    $this->currentPassword = $password;
    $this->currentPassiveMode = $passiveMode;

    if ($this->connectionId = ftp_connect($hostName)) {
      if (ftp_login($this->connectionId, $userName, $password)) {
        ftp_pasv($this->connectionId, $passiveMode);
      } else {
        throw new Exception('Can not connect to ' . $hostName . ' as ' . $userName);
      }
    } else {
      throw new Exception('Can not connect to ' . $hostName);
    }

  }
  
  public function reset() {

    ftp_close($this->connectionId);

    $this->connect($this->currentHostName, $this->currentUserName, $this->currentPassword, $this->currentPassiveMode);

  }

  public function changeDir($directory) {

    if (ftp_chdir($this->connectionId, $directory)) {
      $this->currentDirectory = rtrim($directory, '/') . '/';
    } else {
      throw new Exception('Can not change remote directory to ' . $directory);      
    }

  }

  public function iterateDir($mask, $callback = null) {

    if (gettype($mask) == 'string') {

    } else {
      $callback = $mask;
      $mask = null;
    }

    if ($ftpRAWList = ftp_rawlist($this->connectionId, $this->currentDirectory)) {
      if (is_array($ftpRAWList)) {
        foreach($ftpRAWList as $line) {
          $ftpFileObject = new BrFTPFileObject($line);
          $proceed = true;
          if ($mask) {
            $proceed = preg_match('#' . $mask . '#', $ftpFileObject->name());
          }
          if ($proceed) {
            $callback($this, $ftpFileObject);
          }
        }
      }
    }

  }

  public function uploadFile($sourceFilePath, $targetFileName = null, $mode = FTP_BINARY) {

    if (!$targetFileName) {
      $targetFileName = br()->fs()->fileName($targetFileName);
    }

    $targetFileNamePartial = $targetFileName . '.partial';

    if (ftp_put($this->connectionId, $targetFileNamePartial, $sourceFilePath, $mode)) {
      if (ftp_rename($this->connectionId, $targetFileNamePartial, $targetFileName)) {
        return true;
      }
    }

    throw new Exception('Can not upload file ' . $sourceFilePath);
    
  }

  public function deleteFile($fileName) {

    return ftp_delete($this->connectionId, $fileName);

  }

  public function renameFile($oldFileName, $newFileName) {

    return ftp_rename($this->connectionId, $oldFileName, $newFileName);

  }

  public function downloadFile($sourceFileName, $targetFilePath, $targetFileName = null, $mode = FTP_BINARY) {

    $targetFilePath = br()->fs()->normalizePath($targetFilePath);

    if (!$targetFileName) {
      $targetFileName = $sourceFileName;
    }

    $targetFileNamePartial = $targetFileName . '.partial';

    if (ftp_get($this->connectionId, $targetFilePath . $targetFileNamePartial, $sourceFileName, $mode)) {
      if (rename($targetFilePath . $targetFileNamePartial, $targetFilePath . $targetFileName)) {
        return true;
      }
    }

    throw new Exception('Can not download file ' . $targetFileName);

  }

  public function isFileExists($fileName) {

    $exists = false;
    $this->iterateDir($fileName, function() use (&$exists) {
      $exists = true;
    });
    return $exists;

  }
  
}
