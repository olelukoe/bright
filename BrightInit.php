<?php

/**
 * Project:     Bright framework
 * Author:      Jager Mesh (jagermesh@gmail.com)
 *
 * @version 1.1.0.0
 * @package Bright Core
 */

// br() helper function
require_once(__DIR__.'/Br.php');

// Installing custom error handler
require_once(__DIR__.'/BrErrorHandler.php');
BrErrorHandler::getInstance();

// Core PHP settings
if (function_exists('set_magic_quotes_runtime')) {
  @set_magic_quotes_runtime(0);
}

if (get_magic_quotes_gpc()) {
  br()->stripSlashes($_GET);
  br()->stripSlashes($_POST);
  br()->stripSlashes($_COOKIE);
  br()->stripSlashes($_REQUEST);
  if (isset($_SERVER['PHP_AUTH_USER'])) br()->stripSlashes($_SERVER['PHP_AUTH_USER']);
  if (isset($_SERVER['PHP_AUTH_PW'])) br()->stripSlashes($_SERVER['PHP_AUTH_PW']);
}

ini_set('url_rewriter.tags', null);
@date_default_timezone_set(@date_default_timezone_get());
// Core PHP settings - End

// Application base path - we assuming that Bright library included by main index.php
$traces = debug_backtrace();
if (strtolower(basename($traces[0]['file'])) == 'bright.php') {
  br()->saveCallerScript($traces[1]['file']);
} else {
  br()->saveCallerScript($traces[0]['file']);
}

// Logging
br()->importLib('FileLogAdapter');
br()->importLib('ErrorFileLogAdapter');
br()->importLib('ErrorMailLogAdapter');
br()->log()->addAdapter(new BrFileLogAdapter(br()->atBasePath('_logs')));
br()->log()->addAdapter(new BrErrorFileLogAdapter(br()->atBasePath('_logs')));
br()->log()->addAdapter(new BrErrorMailLogAdapter());

if (br()->isConsoleMode()) {
  br()->importLib('ConsoleLogAdapter');
  br()->log()->addAdapter(new BrConsoleLogAdapter());
}

// Loading application settings
br()->importAtBasePath('config.php');

// Core PHP settings - Secondary
ini_set('session.gc_maxlifetime', br()->config()->get('php/session.gc_maxlifetime', 3600));
ini_set('session.cache_expire', br()->config()->get('php/session.cache_expire', 180));
ini_set('session.cookie_lifetime', br()->config()->get('php/session.cookie_lifetime', 0));
// Core PHP settings - Secondary - End
