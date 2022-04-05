
-- make sure the websiteuser account is set up and has the correct privileges
CREATE USER IF NOT EXISTS websiteuser IDENTIFIED BY 'websitepassword';
GRANT INSERT, SELECT, UPDATE, DELETE ON website.* TO websiteuser;

USE website;

CREATE TABLE IF NOT EXISTS accounts (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(75) NOT NULL DEFAULT 'N/A',
  user VARCHAR(25) NOT NULL,
  pass VARCHAR(70) NOT NULL,
  avatar LONGBLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  userid MEDIUMINT UNSIGNED NOT NULL,
  manager BOOLEAN NOT NULL,
  FOREIGN KEY (userid) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS expense (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user VARCHAR(25) NOT NULL,
  currDate DATETIME NOT NULL,
  approvalStatus VARCHAR(13) NOT NULL DEFAULT 'not-approved',
  incDate DATE NOT NULL,
  category VARCHAR(13) NOT NULL,
  label VARCHAR(30) NOT NULL,
  amount DOUBLE(10,2) NOT NULL,
  description LONGTEXT,
  receipt LONGBLOB NOT NULL
);


INSERT INTO roles(userid, manager) VALUES(6, 0);
  (2, 1);



