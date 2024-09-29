<?php
  // configuration
  $db_host = "localhost";
  $db_username = "root";
  $db_password = "";
  $db_name = "test";

  // connect to database
  $conn = mysqli_connect($db_host, $db_username, $db_password, $db_name);

  // check connection
  if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
  }

  // create HTML form
  echo "<h2>Login</h2>";
  echo "<form action='" . $_SERVER["PHP_SELF"] . "' method='post'>";
  echo "  <input type='email' name='email' placeholder='Email' required>";
  echo "  <input type='password' name='password' placeholder='Password' required>";
  echo "  <button type='submit'>Login</button>";
  echo "</form>";

  // process form data
  if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST["email"];
    $password = $_POST["password"];

    // query database
    $sql = "SELECT * FROM registration WHERE email = '$email' AND password = '$password'";
    $result = mysqli_query($conn, $sql);

    // display results
    if (mysqli_num_rows($result) > 0) {
      echo "Welcome, " . $email;
    } else {
      echo "Invalid email or password";
    }
  }

  // close database connection
  mysqli_close($conn);
?>
