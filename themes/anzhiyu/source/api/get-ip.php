<?php
header('Content-Type: application/json');

// 得到客户端到服务器的第一个 ip
$ip = $_SERVER['REMOTE_ADDR'];

echo json_encode(['ip' => $ip]);