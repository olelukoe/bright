<?php

/**
 * Project:     Bright framework
 * Author:      Jager Mesh (jagermesh@gmail.com)
 *
 * @version 1.1.0.0
 * @package Bright Core
 */

require_once(__DIR__.'/BrObject.php');
require_once(__DIR__.'/BrFileSystem.php');

require_once(dirname(__DIR__).'/3rdparty/phpseclib0.3.0/Net/SFTP.php');
require_once(dirname(__DIR__).'/3rdparty/phpseclib0.3.0/Crypt/RSA.php');

class BrSFTPFileObject {

  private $name;
  private $size;
  private $isDirectory;

  function __construct($name, $params) {

    $this->isDirectory = ($params['type'] == 2);
    $this->size = $params['size'];
    $this->name = $name;

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

class BrSFTP extends BrObject {

  private $connection;
  private $currentDirectory = '/';
  private $currentHostName;
  private $currentUserName;
  private $currentPassword;
  private $currentPort;
  private $sftp;

  function __construct() {

    parent::__construct();

  }

  function connectWithKey($hostName, $userName, $keyFileName, $port = 22, $keyFilePassword = '') {

    $key = new Crypt_RSA();
    if ($keyFilePassword) {
      $key->setPassword($keyFilePassword);
    }
    $key->loadKey(file_get_contents($keyFileName));

    $this->connect($hostName, $userName, $key, $port);

  }

  function connect($hostName, $userName, $password, $port = 22) {

    $this->currentHostName = $hostName;
    $this->currentUserName = $userName;
    $this->currentPassword = $password;
    $this->currentPort     = $port;

    $this->connection = new Net_SFTP($hostName, $port);

    if ($this->connection->login($userName, $password)) {
      $this->currentDirectory = $this->getServerDir();
    } else {
      throw new Exception('Can not connect to ' . $hostName . ' as ' . $userName);
    }

  }

  public function disconnect() {

    try {
      $this->connection = null;
    } catch (Exception $e) {

    }

  }

  public function reset() {

    $dir = $this->currentDirectory;
    $this->disconnect();
    $this->connect($this->currentHostName, $this->currentUserName, $this->currentPassword, $this->currentPort);
    $this->changeDir($dir);

  }

  public function changeDir($directory) {

    if ($this->connection->chdir($directory)) {
      $this->currentDirectory = $this->getServerDir();
    } else {
      throw new Exception('Can not change remote directory to ' . $directory);
    }

  }

  public function getCurrentDir() {

    return $this->getServerDir();

  }

  public function getServerDir() {

    return rtrim(str_replace('\\', '/', $this->connection->pwd()), '/') . '/';

  }

  public function iterateDir($mask, $callback = null, $options = array()) {

    if (gettype($mask) == 'string') {

    } else {
      $options  = $callback;
      $callback = $mask;
      $mask     = null;
    }

    $order = br($options, 'order');

    if ($ftpRAWList = $this->connection->rawlist($this->currentDirectory)) {
      if (is_array($ftpRAWList)) {
        switch ($order) {
          case 'datetime':
          case 'datetimeAsc':
            uasort($ftpRAWList, function($a, $b) {
              return br($a, 'mtime') == br($b, 'mtime') ? 0 : (br($a, 'mtime') > br($b, 'mtime') ? -1 : 1 );
            });
            break;
          case 'datetimeDesc':
            uasort($ftpRAWList, function($a, $b) {
              return br($a, 'mtime') == br($b, 'mtime') ? 0 : (br($a, 'mtime') > br($b, 'mtime') ? 1 : -1 );
            });
            break;
        }
        foreach($ftpRAWList as $name => $params) {
          $ftpFileObject = new BrSFTPFileObject($name, $params);
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

    if ($this->connection->put($this->currentDirectory . $targetFileNamePartial, $sourceFilePath, NET_SFTP_LOCAL_FILE)) {
      if ($this->renameFile($this->currentDirectory . $targetFileNamePartial, $this->currentDirectory . $targetFileName)) {
        return true;
      }
    }

    throw new Exception('Can not upload file ' . $sourceFilePath);

  }

  public function deleteFile($fileName) {

    return $this->connection->delete($fileName);

  }

  public function renameFile($oldFileName, $newFileName) {

    return $this->connection->rename($oldFileName, $newFileName);

  }

  public function makeDir($name) {

    return $this->connection->mkdir($name);

  }

  public function downloadFile($sourceFileName, $targetFilePath, $targetFileName = null, $mode = FTP_BINARY) {

    $targetFilePath = br()->fs()->normalizePath($targetFilePath);

    if (!$targetFileName) {
      $targetFileName = $sourceFileName;
    }

    $targetFileNamePartial = $targetFileName . '.partial';

    if ($this->connection->get($this->currentDirectory . $sourceFileName, $targetFilePath . $targetFileNamePartial)) {
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

