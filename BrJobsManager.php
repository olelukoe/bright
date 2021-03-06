<?php

class BrJobsManager {

  private $shellScript = 'nohup /usr/bin/php -f';
  private $jobScript = 'job.php';
  private $maxProcessesAmount = 1;

  function __construct($params = array()) {

    $traces = debug_backtrace();
    $callerScript = $traces[0]['file'];

    $this->baseFolder = br($params, 'jobsFolder', br()->fs()->filePath($callerScript));
    $this->jobsFolder = $this->baseFolder . 'jobs/';
    $this->jobScript = $this->baseFolder . 'run-job.php';

  }

  function run() {

    if (!br()->isConsoleMode()) { br()->panic('Console mode only'); }

    br()->log('Trying to acquire lock for this script to avoid conflict with running instance');
    $handle = br()->OS()->lockIfRunning(__FILE__);

    $coresAmount = br()->OS()->getCoresAmount();

    $this->maxProcessesAmount = $coresAmount * 10;

    br()->log($coresAmount . ' processor(s) found');
    br()->log('Jobs folder: ' . $this->jobsFolder);
    br()->log($this->maxProcessesAmount . ' will be the max allowed processes to spawn');

    while (true) {

      if (br()->OS()->getProcessesAmount($this->jobScript) < $this->maxProcessesAmount) {

        $jobs = array();
        br()->fs()->iterateDir($this->jobsFolder, '^Job.*[.]php$', function($jobFile) use (&$jobs) {
          $jobs[] = array( 'classFile' => $jobFile->nameWithPath()
                         , 'className' => preg_replace('#[.]php$#', '', $jobFile->name())
                         );
        });

        foreach ($jobs as $jobDesc) {
          try {
            require_once($jobDesc['classFile']);
            $job = new $jobDesc['className'];
            if ($list = $job->timeTotStart()) {
              if (is_array($list)) {

              } else {
                $list = array(null);
              }
              foreach($list as $params) {
                if (br()->OS()->getProcessesAmount($this->jobScript) < $this->maxProcessesAmount) {
                  $runCommand = $this->jobScript . ' ' . $jobDesc['classFile'] . ' ' . $jobDesc['className'] . ' ' . $params;
                  br()->log('[TIME TO START] ' . $runCommand);
                  if (br()->OS()->getProcessesAmount($runCommand) > 0) {
                    br()->log('  Already in progress');
                  } else {
                    $command = $this->shellScript . ' ' . $runCommand . ' > /dev/null 2>&1 & echo $!';
                    $output = '';
                    exec($command, $output);
                    br()->log('  Started, PID = ' . @$output[0]);
                    sleep(3);
                  }
                } else {
                  br()->log('Too much processes started already.');
                  break;
                }
              }
            }
          } catch (Exception $e) {
            br()->log()->logException($e);
          }
        }
      }

      sleep(60);

    }

  }

}
