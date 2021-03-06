<?php

/**
 * Project:     Bright framework
 * Author:      Jager Mesh (jagermesh@gmail.com)
 *
 * @version 1.1.0.0
 * @package Bright Core
 */

require_once(__DIR__.'/BrObject.php');
require_once(__DIR__.'/BrException.php');

class BrDataBaseException extends BrException {

}

class BrDataBase extends BrObject {

  public static function getInstance($name = 'default') {

    static $instances = array();

    $instance = null;

    if (!isset($instances[$name])) {

      if ($dbList = br()->config()->get('db')) {

        $dbConfig = br($dbList, $name, $dbList);

        br()->assert($dbConfig, 'Database [' . $name . '] not configured');

        switch($dbConfig['engine']) {
          case "mysql":
            require_once(__DIR__.'/BrMySQLDBProvider.php');
            $instance = new BrMySQLDBProvider($dbConfig);
            break;
          case "mongodb":
            require_once(__DIR__.'/BrMongoDBProvider.php');
            $instance = new BrMongoDBProvider($dbConfig);
            break;
        }

        $instances[$name] = $instance;

      }

    } else {

      $instance = $instances[$name];

    }

    return $instance;

  }

  function __construct() {

    parent::__construct();

  }

}

