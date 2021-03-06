<?php

/**
 * Project:     Bright framework
 * Author:      Jager Mesh (jagermesh@gmail.com)
 *
 * @version 1.1.0.0
 * @package Bright Core
 */

require_once(__DIR__.'/BrObject.php');

class BrGenericCacheProvider extends BrObject {

  private $cacheTag = null;

  function __construct($cfg) {
    
    if ($this->isSupported()) {      
      $this->cacheTag = md5(__FILE__);
    } else {
      throw new BrException(get_class($this).' is not supported.');
    }
    
  }

  protected function safeName($name) {

    return $this->cacheTag.':'.$name;

  }

  public function reset() {
  
  }
  
  public function exists($name) {
  
    return false;
               
  }
  
  public function get($name, $default, $saveDefault = false) {
             
  }
  
  public function set($name, $value, $expirationSeconds = null) {
      
  }

  public function remove($name) {

  }

  public static function isSupported() {
    
    return true;
    
  }

}

