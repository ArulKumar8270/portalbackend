-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 22, 2024 at 01:44 PM
-- Server version: 10.11.10-MariaDB
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u490757224_nicknameportal`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` int(11) NOT NULL,
  `fullname` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `orderId` int(11) DEFAULT NULL,
  `custId` int(11) DEFAULT NULL,
  `discrict` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `states` varchar(255) DEFAULT NULL,
  `area` varchar(255) DEFAULT NULL,
  `shipping` text DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ads`
--

CREATE TABLE `ads` (
  `id` int(11) NOT NULL,
  `customerId` int(11) NOT NULL,
  `adImage` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `storeId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `areas`
--

CREATE TABLE `areas` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `locationId` int(11) DEFAULT NULL,
  `zipcode` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `areas`
--

INSERT INTO `areas` (`id`, `name`, `locationId`, `zipcode`, `status`, `createdAt`, `updatedAt`) VALUES
(3, 'Chennai', 3, 600001, 1, '2024-08-22 23:50:55', '2024-08-22 23:50:55');

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `orderId` int(11) NOT NULL,
  `price` int(11) DEFAULT NULL,
  `total` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `storeId` int(150) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `carts`
--

INSERT INTO `carts` (`id`, `productId`, `name`, `orderId`, `price`, `total`, `qty`, `photo`, `storeId`, `createdAt`, `updatedAt`) VALUES
(66, 85, 'tamil', 55, 40000, NULL, 1, 'uploads/photo_1732357928279.jpg', 0, '2024-12-22 13:31:48', '2024-12-22 13:31:48');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `createdId` text DEFAULT NULL,
  `createdType` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `createdAt`, `updatedAt`, `createdId`, `createdType`) VALUES
(28, 'Bike', 'Bike', '2024-11-17 11:42:56', '2024-11-17 11:42:56', '27', 'Store'),
(29, 'Mobile', 'Mobile', '2024-11-17 12:10:07', '2024-11-17 12:10:07', '27', 'Store'),
(30, 'mango', 'mango', '2024-11-23 07:31:16', '2024-11-23 07:31:16', '53', 'Vendor'),
(31, 'appyl', 'appyl', '2024-11-23 07:45:02', '2024-11-23 07:45:02', '53', 'Vendor'),
(32, 'cake', 'cake', '2024-11-23 07:46:57', '2024-11-23 07:46:57', '53', 'Vendor'),
(33, 'ice', 'ice', '2024-11-23 07:47:41', '2024-11-23 07:47:41', '53', 'Vendor'),
(34, 'furutis mix ice', 'furutis mix ice', '2024-11-23 07:48:29', '2024-11-23 07:48:29', '53', 'Vendor'),
(35, 'dress men', 'dress men', '2024-11-23 10:26:43', '2024-11-23 10:26:43', '55', 'Store'),
(36, 'dress woman', 'dress woman', '2024-11-23 10:26:56', '2024-11-23 10:26:56', '55', 'Store'),
(37, 'dress  chilrans', 'dress  chilrans', '2024-11-23 10:27:13', '2024-11-23 10:27:13', '55', 'Store'),
(38, 'bag', 'bag', '2024-11-23 10:27:34', '2024-11-23 10:27:34', '55', 'Store'),
(39, 'laptop', 'laptop', '2024-11-23 10:57:44', '2024-11-23 10:57:44', '54', 'Store'),
(40, 'ear buts', 'ear buts', '2024-11-23 10:57:59', '2024-11-23 10:57:59', '54', 'Store'),
(41, 'lakshumi', 'lakshumi', '2024-11-26 07:12:06', '2024-11-26 07:12:06', '48', 'Store'),
(42, 'fan new models', 'fan new models', '2024-11-26 07:13:07', '2024-11-26 07:13:07', '48', 'Store'),
(43, 'charger wire', 'charger wire', '2024-11-26 07:13:53', '2024-11-26 07:13:53', '48', 'Store'),
(44, 'raise bag', 'raise bag', '2024-11-26 07:14:37', '2024-11-26 07:14:37', '48', 'Store'),
(45, 'sakthi massala', 'sakthi massala', '2024-11-26 07:15:11', '2024-11-26 07:15:11', '48', 'Store'),
(46, 'appolo medical', 'appolo medical', '2024-11-26 07:15:57', '2024-11-26 07:15:57', '48', 'Store'),
(47, 'kumaran farnichar', 'kumaran farnichar', '2024-11-26 07:16:28', '2024-11-26 07:16:28', '48', 'Store'),
(48, 'tabale fan', 'tabale fan', '2024-11-26 08:32:12', '2024-11-26 08:32:12', '60', 'Store'),
(49, 'books', 'books', '2024-11-26 09:31:15', '2024-11-26 09:31:15', '54', 'Store'),
(50, 'govind', 'govind', '2024-11-26 15:01:55', '2024-11-26 15:01:55', '48', 'Store'),
(51, 'babu', 'babu', '2024-11-26 15:02:18', '2024-11-26 15:02:18', '48', 'Store'),
(52, 'vellumurugan', 'vellumurugan', '2024-11-26 15:02:50', '2024-11-26 15:02:50', '48', 'Store'),
(53, 'prasanth store', 'prasanth store', '2024-11-26 15:09:38', '2024-11-26 15:09:38', '48', 'Store'),
(54, 'paranthman', 'paranthman', '2024-11-26 15:12:30', '2024-11-26 15:12:30', '48', 'Store'),
(55, 'kavitha', 'kavitha', '2024-11-26 15:12:48', '2024-11-26 15:12:48', '48', 'Store'),
(56, 'whatch', 'whatch', '2024-11-26 15:41:18', '2024-11-26 15:41:18', '62', 'Vendor'),
(57, 'home furnichar', 'home furnichar', '2024-11-27 16:55:36', '2024-11-27 16:55:36', '61', 'Vendor'),
(58, 'milke', 'milke', '2024-11-27 17:25:04', '2024-11-27 17:25:04', '72', 'Vendor'),
(59, 'lipbom', 'lipbom', '2024-12-16 05:49:38', '2024-12-16 05:49:38', '48', 'Store'),
(60, 'sweet', 'sweet', '2024-12-16 05:54:34', '2024-12-16 05:54:34', '54', 'Store');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `userid` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `zipcode` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `name`, `status`, `zipcode`, `createdAt`, `updatedAt`) VALUES
(3, 'TamilNadu', 1, 600001, '2024-08-22 23:50:23', '2024-08-22 23:50:23');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `custId` int(11) NOT NULL,
  `number` varchar(255) DEFAULT NULL,
  `paymentmethod` varchar(255) DEFAULT NULL,
  `deliverydate` date DEFAULT NULL,
  `grandtotal` int(50) DEFAULT NULL,
  `status` enum('processing','shipping','delivered','cancelled') DEFAULT 'processing',
  `productIds` int(150) NOT NULL,
  `qty` int(100) NOT NULL,
  `storeId` int(150) NOT NULL,
  `customization` varchar(1500) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `custId`, `number`, `paymentmethod`, `deliverydate`, `grandtotal`, `status`, `productIds`, `qty`, `storeId`, `customization`, `createdAt`, `updatedAt`) VALUES
(33, 41, '41', '1', NULL, 0, 'processing', 85, 1, 32, '509234kjahskjd', '2024-11-25 19:18:23', '2024-11-25'),
(34, 41, '41', '1', NULL, 0, 'processing', 85, 1, 32, NULL, '2024-11-27 18:34:42', '2024-11-27'),
(35, 41, '41', '1', NULL, 0, 'processing', 85, 1, 32, NULL, '2024-11-28 19:46:50', '2024-11-28'),
(36, 41, '41', '1', '2024-12-17', 0, 'cancelled', 85, 1, 32, NULL, '2024-11-28 19:49:27', '2024-12-22'),
(37, 41, '41', '1', '2000-04-04', 0, 'shipping', 85, 1, 32, NULL, '2024-11-28 19:50:41', '2024-12-22'),
(38, 55, '55', '1', NULL, 0, 'processing', 85, 0, 32, NULL, '2024-12-22 13:09:39', '2024-12-22'),
(39, 55, '55', '1', NULL, 40000, 'processing', 85, 1, 32, NULL, '2024-12-22 13:36:44', '2024-12-22');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `custId` int(11) NOT NULL,
  `amount` double DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `method` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `orderCreationId` varchar(255) DEFAULT NULL,
  `razorpayPaymentId` varchar(255) DEFAULT NULL,
  `razorpayOrderId` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `productfeedbacks`
--

CREATE TABLE `productfeedbacks` (
  `id` int(11) NOT NULL,
  `customerId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `vendorId` int(11) NOT NULL,
  `storeId` int(11) NOT NULL,
  `feedBack` varchar(255) DEFAULT NULL,
  `rating` varchar(255) DEFAULT NULL,
  `customizedMessage` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `productoffers`
--

CREATE TABLE `productoffers` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `discount_per` varchar(255) DEFAULT NULL,
  `discount_price` float DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `total` float DEFAULT NULL,
  `net_price` float DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `productphotos`
--

CREATE TABLE `productphotos` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `imgUrl` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `subCategoryId` int(11) DEFAULT NULL,
  `childCategoryId` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `unitSize` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `buyerPrice` int(11) DEFAULT NULL,
  `price` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `discountPer` int(11) DEFAULT NULL,
  `discount` int(11) DEFAULT NULL,
  `total` int(11) NOT NULL,
  `netPrice` int(11) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `sortDesc` text DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `paymentMode` varchar(255) DEFAULT NULL,
  `createdId` int(11) DEFAULT NULL,
  `createdType` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isEnableEcommerce` varchar(255) DEFAULT NULL,
  `isEnableCustomize` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `categoryId`, `subCategoryId`, `childCategoryId`, `name`, `slug`, `brand`, `unitSize`, `status`, `buyerPrice`, `price`, `qty`, `discountPer`, `discount`, `total`, `netPrice`, `photo`, `sortDesc`, `desc`, `paymentMode`, `createdId`, `createdType`, `createdAt`, `updatedAt`, `isEnableEcommerce`, `isEnableCustomize`) VALUES
(82, 60, 3, 3, 'chinna', 'chinna', 'null', 'box 1', '1', 0, 75, 1, 19, 25, 56, 0, 'uploads/photo_1734330702108.jpg', 'no retan', 'null', '1,2,3', 31, 'Store', '2024-11-23 10:06:56', '2024-12-16 06:31:42', '1', 0),
(83, 28, 3, 3, 'sathish', 'sathish', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732356919137.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-23 10:15:19', '2024-11-23 10:15:19', '0', 0),
(84, 31, 3, 3, 'hari', 'hari', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732357757268.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-23 10:29:17', '2024-11-23 10:29:17', '0', 0),
(85, 32, 3, 3, 'tamil', 'tamil', 'null', '10', '1', 0, 5000, 10, 1000, 20, 40000, 0, 'uploads/photo_1732357928279.jpg', 'no retan', 'null', '1,2,3', 32, 'Store', '2024-11-23 10:30:47', '2024-12-22 12:22:00', '1', 1),
(86, 33, 3, 3, 'guna', 'guna', NULL, '10', '1', NULL, 10, 30, 2, 20, 240, 0, 'uploads/photo_1732358006307.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-23 10:33:26', '2024-11-23 10:33:26', '0', 0),
(90, 35, 3, 3, 'ramesh', 'ramesh', NULL, '500', '0', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732358155219.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-23 10:35:55', '2024-11-23 10:35:55', '0', 0),
(91, 36, 3, 3, 'deep', 'deep', NULL, '100', '0', NULL, 5000, 1000, 1000, 20, 4000000, 0, 'uploads/photo_1732358280770.jpg', 'coming zone', NULL, '1,2,3', 32, 'Store', '2024-11-23 10:38:00', '2024-11-23 10:38:00', '0', 0),
(94, 39, 3, 3, 'guan', 'guan', NULL, '10', '1', NULL, 10, 30, 2, 20, 240, 0, 'uploads/photo_1732359540104.jpg', 'no retan', NULL, '1,2,3', 31, 'Store', '2024-11-23 10:59:00', '2024-11-23 10:59:00', '0', 0),
(97, 30, 3, 3, 'prathap', 'prathap', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732381326160.jpg', 'no retan', NULL, '1,2,3', 33, 'Store', '2024-11-23 17:02:06', '2024-11-23 17:02:06', '0', 0),
(98, 33, 3, 3, 'lala', 'lala', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732381744478.jpg', 'no retan', NULL, '1,2,3', 33, 'Store', '2024-11-23 17:09:04', '2024-11-23 17:09:04', '0', 0),
(101, 33, 3, 3, 'maka', 'maka', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732381883027.jpg', 'no retan', NULL, '1,2,3', 33, 'Store', '2024-11-23 17:11:23', '2024-11-23 17:11:23', '0', 0),
(102, 33, 3, 3, 'specal', 'specal', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732381959678.jpg', 'no retan', NULL, '1,2,3', 33, 'Store', '2024-11-23 17:12:39', '2024-11-23 17:12:39', '0', 0),
(103, 29, 3, 3, 'opp', 'opp', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732382226739.jpg', 'no retan', NULL, '1,2,3', 33, 'Store', '2024-11-23 17:17:06', '2024-11-23 17:17:06', '0', 0),
(104, 29, 3, 3, 'vivo', 'vivo', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732382298468.jpg', 'no retan', NULL, '1,2,3', 46, 'Vendor', '2024-11-23 17:18:18', '2024-11-23 17:18:18', '0', 0),
(105, 29, 3, 3, 'cmf', 'cmf', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732382366235.jpg', 'no retan', NULL, '1,2,3', 46, 'Vendor', '2024-11-23 17:19:26', '2024-11-23 17:19:26', '0', 0),
(106, 29, 3, 3, 'poco', 'poco', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732382420338.jpg', 'no retan', NULL, '1,2,3', 46, 'Vendor', '2024-11-23 17:20:20', '2024-11-23 17:20:20', '0', 0),
(107, 29, 3, 3, 'redmi', 'redmi', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732382475087.jpg', 'no retan', NULL, '1,2,3', 46, 'Vendor', '2024-11-23 17:21:15', '2024-11-23 17:21:15', '0', 0),
(108, 41, 3, 3, 'sam', 'sam', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732606949452.jpg', 'no retan', NULL, '1,2,3', 35, 'Store', '2024-11-26 07:42:29', '2024-11-26 07:42:29', '0', 0),
(109, 41, 3, 3, 'kosuvathi', 'kosuvathi', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732607109619.jpg', 'no retan', NULL, '1,2,3', 35, 'Store', '2024-11-26 07:45:09', '2024-11-26 07:45:09', '0', 0),
(110, 41, 3, 3, 'cup samarani low model', 'cup samarani low model', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732607272767.jpg', 'no retan', NULL, '1,2,3', 35, 'Store', '2024-11-26 07:47:52', '2024-11-26 07:47:52', '0', 0),
(111, 41, 3, 3, 'cup samarani mod2', 'cup samarani mod2', NULL, '10', '1', NULL, 20, 30, 4, 20, 480, 0, 'uploads/photo_1732607353544.jpg', 'no retan', NULL, '1,2,3', 35, 'Store', '2024-11-26 07:49:13', '2024-11-26 07:49:13', '0', 0),
(112, 41, 3, 3, 'cup modl 3', 'cup modl 3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732607410161.jpg', 'no retan', NULL, '1,2,3', 35, 'Store', '2024-11-26 07:50:10', '2024-11-26 07:50:10', '0', 0),
(113, 41, 3, 3, 'cup model 4', 'cup model 4', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732607488925.jpg', 'no retan', NULL, '1,2,3', 35, 'Store', '2024-11-26 07:51:28', '2024-11-26 07:51:28', '0', 0),
(114, 41, 3, 3, 'cup modl 5', 'cup modl 5', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732607561494.jpg', 'no retan', NULL, '1,2,3', 35, 'Store', '2024-11-26 07:52:41', '2024-11-26 07:52:41', '0', 0),
(115, 42, 3, 3, 'wold bule', 'wold bule', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732608530579.jpg', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 08:08:50', '2024-11-26 08:08:50', '0', 0),
(116, 42, 3, 3, 'red perfume', 'red perfume', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732608632887.jpg', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 08:10:32', '2024-11-26 08:10:32', '0', 0),
(117, 42, 3, 3, 'zed', 'zed', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732608942733.png', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 08:15:42', '2024-11-26 08:15:42', '0', 0),
(118, 42, 3, 3, 'boss', 'boss', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732609128692.jpg', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 08:18:48', '2024-11-26 08:18:48', '0', 0),
(119, 42, 3, 3, 'millean', 'millean', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732609203063.jpg', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 08:20:03', '2024-11-26 08:20:03', '0', 0),
(120, 42, 3, 3, 'original', 'original', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732609271511.jpg', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 08:21:11', '2024-11-26 08:21:11', '0', 0),
(121, 42, 3, 3, 'sk perfume', 'sk perfume', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732609340652.jpg', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 08:22:20', '2024-11-26 08:22:20', '0', 0),
(122, 42, 3, 3, 'black perfume good feed back', 'black perfume good feed back', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732609425554.jpg', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 08:23:45', '2024-11-26 08:23:45', '0', 0),
(123, 42, 3, 3, 'super', 'super', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732609489516.jpg', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 08:24:49', '2024-11-26 08:24:49', '0', 0),
(124, 48, 3, 3, 'table fan', 'table fan', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732610175323.jpg', 'no retan', NULL, '1,2,3', 34, 'Store', '2024-11-26 08:36:15', '2024-11-26 08:36:15', '0', 0),
(125, 48, 3, 3, 'table sumal', 'table sumal', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732610298200.jpg', 'no retan', NULL, '1,2,3', 34, 'Store', '2024-11-26 08:38:18', '2024-11-26 08:38:18', '0', 0),
(126, 48, 3, 3, 'side type', 'side type', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732612712169.jpg', 'no retan', NULL, '1,2,3', 34, 'Store', '2024-11-26 09:18:32', '2024-11-26 09:18:32', '0', 0),
(127, 48, 3, 3, 'underground', 'underground', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732612772918.jpg', 'no retan', NULL, '1,2,3', 34, 'Store', '2024-11-26 09:19:32', '2024-11-26 09:19:32', '0', 0),
(128, 48, 3, 3, 'big size fan', 'big size fan', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732612863539.jpg', 'no retan', NULL, '1,2,3', 34, 'Store', '2024-11-26 09:21:03', '2024-11-26 09:21:03', '0', 0),
(129, 48, 3, 3, 'white color fan', 'white color fan', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732612957960.jpg', 'no retan', NULL, '1,2,3', 34, 'Store', '2024-11-26 09:22:37', '2024-11-26 09:22:37', '0', 0),
(130, 48, 3, 3, 'redcolor fan', 'redcolor fan', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732613026773.jpg', 'no retan', NULL, '1,2,3', 34, 'Store', '2024-11-26 09:23:46', '2024-11-26 09:23:46', '0', 0),
(131, 48, 3, 3, 'balck color fan', 'balck color fan', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732613085516.jpg', 'no retan', NULL, '1,2,3', 34, 'Store', '2024-11-26 09:24:45', '2024-11-26 09:24:45', '0', 0),
(132, 49, 3, 3, 'book 1', 'book 1', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732613551935.jpg', 'no retan', NULL, '1,2,3', 31, 'Store', '2024-11-26 09:32:31', '2024-11-26 09:32:31', '0', 0),
(133, 49, 3, 3, 'book2', 'book2', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732613600561.jpg', 'no retan', NULL, '1,2,3', 31, 'Store', '2024-11-26 09:33:20', '2024-11-26 09:33:20', '0', 0),
(134, 49, 3, 3, 'books3', 'books3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732613651248.jpg', 'no retan', NULL, '1,2,3', 31, 'Store', '2024-11-26 09:34:11', '2024-11-26 09:34:11', '0', 0),
(135, 49, 3, 3, 'books', 'books', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732613712443.jpg', 'no retan', NULL, '1,2,3', 31, 'Store', '2024-11-26 09:35:12', '2024-11-26 09:35:12', '0', 0),
(136, 49, 3, 3, 'books5', 'books5', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732613767194.jpg', 'no retan', NULL, '1,2,3', 31, 'Store', '2024-11-26 09:36:07', '2024-11-26 09:36:07', '0', 0),
(137, 49, 3, 3, 'books6', 'books6', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732613829539.jpg', 'no retan', NULL, '1,2,3', 31, 'Store', '2024-11-26 09:37:09', '2024-11-26 09:37:09', '0', 0),
(138, 43, 3, 3, 'addapter 25w', 'addapter 25w', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732614999797.jpg', 'no retan', NULL, '1,2,3', 37, 'Store', '2024-11-26 09:56:39', '2024-11-26 09:56:39', '0', 0),
(139, 43, 3, 3, 'ch35w', 'ch35w', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732615080995.jpg', 'no retan', NULL, '1,2,3', 37, 'Store', '2024-11-26 09:58:00', '2024-11-26 09:58:00', '0', 0),
(140, 43, 3, 3, 'pluge', 'pluge', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732615142730.jpg', 'no retan', NULL, '1,2,3', 37, 'Store', '2024-11-26 09:59:02', '2024-11-26 09:59:02', '0', 0),
(141, 43, 3, 3, 'char25w', 'char25w', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732615212491.jpg', 'no retan', NULL, '1,2,3', 37, 'Store', '2024-11-26 10:00:12', '2024-11-26 10:00:12', '0', 0),
(142, 43, 3, 3, 'char 45w', 'char 45w', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732615275018.jpg', 'no retan', NULL, '1,2,3', 37, 'Store', '2024-11-26 10:01:15', '2024-11-26 10:01:15', '0', 0),
(143, 43, 3, 3, 'char black', 'char black', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732615335060.jpg', 'no retan', NULL, '1,2,3', 37, 'Store', '2024-11-26 10:02:15', '2024-11-26 10:02:15', '0', 0),
(144, 43, 3, 3, 'char black top', 'char black top', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732615398106.jpg', 'no retan', NULL, '1,2,3', 37, 'Store', '2024-11-26 10:03:18', '2024-11-26 10:03:18', '0', 0),
(145, 38, 3, 3, 'puma', 'puma', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732615746738.jpg', 'no retan', NULL, '1,2,3', 38, 'Store', '2024-11-26 10:09:06', '2024-11-26 10:09:06', '0', 0),
(164, 33, 3, 3, 'vennila flower', 'vennila flower', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732616979911.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-26 10:29:39', '2024-11-26 10:29:39', '0', 0),
(165, 33, 3, 3, 'ice vennila', 'ice vennila', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732617038157.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-26 10:30:38', '2024-11-26 10:30:38', '0', 0),
(166, 33, 3, 3, 'ice', 'ice', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732617077527.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-26 10:31:17', '2024-11-26 10:31:17', '0', 0),
(177, 33, 3, 3, 'leam', 'leam', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732617339769.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-26 10:35:39', '2024-11-26 10:35:39', '0', 0),
(178, 33, 3, 3, 'leam ice', 'leam ice', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732617392864.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-26 10:36:32', '2024-11-26 10:36:32', '0', 0),
(179, 33, 3, 3, 'choco', 'choco', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732617460584.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-26 10:37:40', '2024-11-26 10:37:40', '0', 0),
(180, 33, 3, 3, 'batter ice', 'batter ice', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732617539804.jpg', 'no retan', NULL, '1,2,3', 32, 'Store', '2024-11-26 10:38:59', '2024-11-26 10:38:59', '0', 0),
(181, 38, 3, 3, 'old bag', 'old bag', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732617868687.jpg', 'no retan', NULL, '1,2,3', 38, 'Store', '2024-11-26 10:44:28', '2024-11-26 10:44:28', '0', 0),
(182, 38, 3, 3, 'bag2', 'bag2', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732617919693.jpg', 'no retan', NULL, '1,2,3', 38, 'Store', '2024-11-26 10:45:19', '2024-11-26 10:45:19', '0', 0),
(183, 38, 3, 3, 'bag3', 'bag3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732617966129.jpg', 'no retan', NULL, '1,2,3', 38, 'Store', '2024-11-26 10:46:06', '2024-11-26 10:46:06', '0', 0),
(184, 38, 3, 3, 'bag4', 'bag4', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732618014747.jpg', 'no retan', NULL, '1,2,3', 38, 'Store', '2024-11-26 10:46:54', '2024-11-26 10:46:54', '0', 0),
(185, 38, 3, 3, 'bag5', 'bag5', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732618068180.jpg', 'no retan', NULL, '1,2,3', 38, 'Store', '2024-11-26 10:47:48', '2024-11-26 10:47:48', '0', 0),
(186, 38, 3, 3, 'bag6', 'bag6', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732618132466.jpg', 'no retan', NULL, '1,2,3', 38, 'Store', '2024-11-26 10:48:52', '2024-11-26 10:48:52', '0', 0),
(187, 38, 3, 3, 'bag7', 'bag7', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732618196444.jpg', 'no retan', NULL, '1,2,3', 38, 'Store', '2024-11-26 10:49:56', '2024-11-26 10:49:56', '0', 0),
(188, 38, 3, 3, 'bag8', 'bag8', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732618249425.jpg', 'no retan', NULL, '1,2,3', 38, 'Store', '2024-11-26 10:50:49', '2024-11-26 10:50:49', '0', 0),
(189, 45, 3, 3, 'sakthi 1', 'sakthi 1', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732618806351.jpg', 'no retan', NULL, '1,2,3', 39, 'Store', '2024-11-26 11:00:06', '2024-11-26 11:00:06', '0', 0),
(190, 45, 3, 3, 'cococont oil normal', 'cococont oil normal', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732618899047.jpg', 'no retan', NULL, '1,2,3', 39, 'Store', '2024-11-26 11:01:39', '2024-11-26 11:01:39', '0', 0),
(191, 45, 3, 3, 'green coc', 'green coc', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732618960316.jpg', 'no retan', NULL, '1,2,3', 39, 'Store', '2024-11-26 11:02:40', '2024-11-26 11:02:40', '0', 0),
(192, 45, 3, 3, 'kalalai', 'kalalai', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619015050.jpg', 'no retan', NULL, '1,2,3', 39, 'Store', '2024-11-26 11:03:35', '2024-11-26 11:03:35', '0', 0),
(193, 45, 3, 3, 'godhumai pa', 'godhumai pa', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619082212.jpg', 'no retan', NULL, '1,2,3', 39, 'Store', '2024-11-26 11:04:42', '2024-11-26 11:04:42', '0', 0),
(194, 45, 3, 3, 'pure godhumai', 'pure godhumai', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619141544.jpg', 'no retan', NULL, '1,2,3', 39, 'Store', '2024-11-26 11:05:41', '2024-11-26 11:05:41', '0', 0),
(195, 45, 3, 3, 'godhu', 'godhu', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619194208.jpg', 'no retan', NULL, '1,2,3', 39, 'Store', '2024-11-26 11:06:34', '2024-11-26 11:06:34', '0', 0),
(196, 45, 3, 3, 'muttai', 'muttai', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619254381.jpg', 'no retan', NULL, '1,2,3', 39, 'Store', '2024-11-26 11:07:34', '2024-11-26 11:07:34', '0', 0),
(197, 45, 3, 3, 'godhumai done', 'godhumai done', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619309825.jpg', 'no retan', NULL, '1,2,3', 39, 'Store', '2024-11-26 11:08:29', '2024-11-26 11:08:29', '0', 0),
(198, 46, 3, 3, 'tablat', 'tablat', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619649037.jpg', 'no retan', NULL, '1,2,3', 40, 'Store', '2024-11-26 11:14:09', '2024-11-26 11:14:09', '0', 0),
(199, 46, 3, 3, 'tanic', 'tanic', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619711231.jpg', 'no retan', NULL, '1,2,3', 40, 'Store', '2024-11-26 11:15:11', '2024-11-26 11:15:11', '0', 0),
(200, 46, 3, 3, 'ta2', 'ta2', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619778922.jpg', 'no retan', NULL, '1,2,3', 40, 'Store', '2024-11-26 11:16:18', '2024-11-26 11:16:18', '0', 0),
(201, 46, 3, 3, 'tab3', 'tab3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619839849.jpg', 'no retan', NULL, '1,2,3', 40, 'Store', '2024-11-26 11:17:19', '2024-11-26 11:17:19', '0', 0),
(202, 46, 3, 3, 'tab2', 'tab2', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732619896098.jpg', 'no retan', NULL, '1,2,3', 40, 'Store', '2024-11-26 11:18:16', '2024-11-26 11:18:16', '0', 0),
(203, 56, 3, 3, 'lether watch', 'lether watch', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732635885249.jpg', 'no retan', NULL, '1,2,3', 48, 'Vendor', '2024-11-26 15:44:45', '2024-11-26 15:44:45', '0', 0),
(204, 50, 3, 3, 'mett', 'mett', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732637047090.webp', 'no retan', NULL, '1,2,3', 36, 'Store', '2024-11-26 16:04:07', '2024-11-26 16:04:07', '0', 0),
(205, 56, 3, 3, 'watch2', 'watch2', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732637874716.jpg', 'no retan', NULL, '1,2,3', 48, 'Vendor', '2024-11-26 16:17:54', '2024-11-26 16:17:54', '0', 0),
(206, 39, 3, 3, 'dell', 'dell', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732638761121.webp', 'no retan', NULL, '1,2,3', 45, 'Vendor', '2024-11-26 16:32:41', '2024-11-26 16:32:41', '0', 0),
(207, 39, 3, 3, 'lenova', 'lenova', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732724016639.jpg', 'no retan', NULL, '1,2,3', 45, 'Vendor', '2024-11-27 16:13:36', '2024-11-27 16:13:36', '0', 0),
(208, 39, 3, 3, 'delloo', 'delloo', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732724100210.jpg', 'no retan', NULL, '1,2,3', 45, 'Vendor', '2024-11-27 16:15:00', '2024-11-27 16:15:00', '0', 0),
(209, 39, 3, 3, 'hp', 'hp', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732724157601.jpg', 'no retan', NULL, '1,2,3', 45, 'Vendor', '2024-11-27 16:15:57', '2024-11-27 16:15:57', '0', 0),
(210, 39, 3, 3, 'hass', 'hass', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732724237153.jpg', 'no retan', NULL, '1,2,3', 45, 'Vendor', '2024-11-27 16:17:17', '2024-11-27 16:17:17', '0', 0),
(211, 39, 3, 3, 'hp2', 'hp2', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732724297656.jpg', 'no retan', NULL, '1,2,3', 45, 'Vendor', '2024-11-27 16:18:17', '2024-11-27 16:18:17', '0', 0),
(212, 39, 3, 3, 'hp3', 'hp3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732724350898.jpg', 'no retan', NULL, '1,2,3', 45, 'Vendor', '2024-11-27 16:19:10', '2024-11-27 16:19:10', '0', 0),
(213, 39, 3, 3, 'hp4', 'hp4', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732724409905.jpg', 'no retan', NULL, '1,2,3', 45, 'Vendor', '2024-11-27 16:20:09', '2024-11-27 16:20:09', '0', 0),
(220, 40, 3, 3, 'ear 1', 'ear 1', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732725575108.jpg', 'no retan', NULL, '1,2,3', 46, 'Vendor', '2024-11-27 16:39:35', '2024-11-27 16:39:35', '0', 0),
(221, 40, 3, 3, 'ear3', 'ear3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732725644564.jpg', 'no retan', NULL, '1,2,3', 46, 'Vendor', '2024-11-27 16:40:44', '2024-11-27 16:40:44', '0', 0),
(222, 40, 3, 3, 'ear4', 'ear4', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732725707045.jpg', 'no retan', NULL, '1,2,3', 46, 'Vendor', '2024-11-27 16:41:47', '2024-11-27 16:41:47', '0', 0),
(223, 40, 3, 3, 'ear5', 'ear5', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732725812856.jpg', 'no retan', NULL, '1,2,3', 46, 'Vendor', '2024-11-27 16:43:32', '2024-11-27 16:43:32', '0', 0),
(227, 57, 3, 3, 'fue1', 'fue1', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732726615334.jpg', 'no retan', NULL, '1,2,3', 47, 'Vendor', '2024-11-27 16:56:55', '2024-11-27 16:56:55', '0', 0),
(228, 57, 3, 3, 'fur3', 'fur3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732726669458.jpg', 'no retan', NULL, '1,2,3', 47, 'Vendor', '2024-11-27 16:57:49', '2024-11-27 16:57:49', '0', 0),
(229, 57, 3, 3, 'fur5', 'fur5', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732726725427.jpg', 'no retan', NULL, '1,2,3', 47, 'Vendor', '2024-11-27 16:58:45', '2024-11-27 16:58:45', '0', 0),
(230, 57, 3, 3, 'fur6', 'fur6', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732726772015.jpg', 'no retan', NULL, '1,2,3', 47, 'Vendor', '2024-11-27 16:59:32', '2024-11-27 16:59:32', '0', 0),
(234, 57, 3, 3, 'fur7', 'fur7', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732726964978.jpg', 'no retan', NULL, '1,2,3', 47, 'Vendor', '2024-11-27 17:02:44', '2024-11-27 17:02:44', '0', 0),
(235, 57, 3, 3, 'fur8', 'fur8', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727021213.jpg', 'no retan', NULL, '1,2,3', 47, 'Vendor', '2024-11-27 17:03:41', '2024-11-27 17:03:41', '0', 0),
(236, 56, 3, 3, 'wa2', 'wa2', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727295335.jpg', 'no retan', NULL, '1,2,3', 48, 'Vendor', '2024-11-27 17:08:15', '2024-11-27 17:08:15', '0', 0),
(237, 56, 3, 3, 'wh3', 'wh3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727343251.jpg', 'no retan', NULL, '1,2,3', 48, 'Vendor', '2024-11-27 17:09:03', '2024-11-27 17:09:03', '0', 0),
(238, 56, 3, 3, 'wh5', 'wh5', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727386117.jpg', 'no retan', NULL, '1,2,3', 48, 'Vendor', '2024-11-27 17:09:46', '2024-11-27 17:09:46', '0', 0),
(239, 56, 3, 3, 'wh6', 'wh6', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727436557.jpg', 'no retan', NULL, '1,2,3', 48, 'Vendor', '2024-11-27 17:10:36', '2024-11-27 17:10:36', '0', 0),
(240, 56, 3, 3, 'wh7', 'wh7', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727487339.jpg', 'no retan', NULL, '1,2,3', 48, 'Vendor', '2024-11-27 17:11:27', '2024-11-27 17:11:27', '0', 0),
(241, 56, 3, 3, 'wh8', 'wh8', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727534167.jpg', 'no retan', NULL, '1,2,3', 48, 'Vendor', '2024-11-27 17:12:14', '2024-11-27 17:12:14', '0', 0),
(242, 30, 3, 3, 'mo1', 'mo1', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727814360.jpg', 'no retan', NULL, '1,2,3', 50, 'Vendor', '2024-11-27 17:16:54', '2024-11-27 17:16:54', '0', 0),
(243, 30, 3, 3, 'mo2', 'mo2', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727861460.jpg', 'no retan', NULL, '1,2,3', 50, 'Vendor', '2024-11-27 17:17:41', '2024-11-27 17:17:41', '0', 0),
(244, 30, 3, 3, 'mo3', 'mo3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727906815.jpg', 'no retan', NULL, '1,2,3', 50, 'Vendor', '2024-11-27 17:18:26', '2024-11-27 17:18:26', '0', 0),
(245, 30, 3, 3, 'mo5', 'mo5', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732727955099.jpg', 'no retan', NULL, '1,2,3', 50, 'Vendor', '2024-11-27 17:19:15', '2024-11-27 17:19:15', '0', 0),
(246, 30, 3, 3, 'mo6', 'mo6', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728015950.jpg', 'no retan', NULL, '1,2,3', 50, 'Vendor', '2024-11-27 17:20:15', '2024-11-27 17:20:15', '0', 0),
(249, 30, 3, 3, 'mo8', 'mo8', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728066624.jpg', 'no retan', NULL, '1,2,3', 50, 'Vendor', '2024-11-27 17:21:06', '2024-11-27 17:21:06', '0', 0),
(250, 30, 3, 3, 'mo9', 'mo9', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728107617.jpg', 'no retan', NULL, '1,2,3', 50, 'Vendor', '2024-11-27 17:21:47', '2024-11-27 17:21:47', '0', 0),
(251, 58, 3, 3, 'mi1', 'mi1', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728358325.jpg', 'no retan', NULL, '1,2,3', 51, 'Vendor', '2024-11-27 17:25:58', '2024-11-27 17:25:58', '0', 0),
(252, 58, 3, 3, 'mi2', 'mi2', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728401260.jpg', 'no retan', NULL, '1,2,3', 51, 'Vendor', '2024-11-27 17:26:41', '2024-11-27 17:26:41', '0', 0),
(253, 58, 3, 3, 'mi3', 'mi3', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728442800.jpg', 'no retan', NULL, '1,2,3', 51, 'Vendor', '2024-11-27 17:27:22', '2024-11-27 17:27:22', '0', 0),
(254, 58, 3, 3, 'mi4', 'mi4', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728491471.jpg', 'no retan', NULL, '1,2,3', 51, 'Vendor', '2024-11-27 17:28:11', '2024-11-27 17:28:11', '0', 0),
(257, 58, 3, 3, 'mi5', 'mi5', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728571232.jpg', 'no retan', NULL, '1,2,3', 51, 'Vendor', '2024-11-27 17:29:31', '2024-11-27 17:29:31', '0', 0),
(258, 58, 3, 3, 'mi6', 'mi6', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728621240.jpg', 'no retan', NULL, '1,2,3', 51, 'Vendor', '2024-11-27 17:30:21', '2024-11-27 17:30:21', '0', 0),
(259, 58, 3, 3, 'm7', 'm7', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728683570.jpg', 'no retan', NULL, '1,2,3', 51, 'Vendor', '2024-11-27 17:31:23', '2024-11-27 17:31:23', '0', 0),
(260, 58, 3, 3, 'mi8', 'mi8', NULL, '10', '1', NULL, 5000, 30, 1000, 20, 120000, 0, 'uploads/photo_1732728736851.jpg', 'no retan', NULL, '1,2,3', 51, 'Vendor', '2024-11-27 17:32:16', '2024-11-27 17:32:16', '0', 0);

-- --------------------------------------------------------

--
-- Table structure for table `requeststores`
--

CREATE TABLE `requeststores` (
  `id` int(11) NOT NULL,
  `requestId` varchar(255) DEFAULT NULL,
  `requesterName` varchar(255) DEFAULT NULL,
  `contactPerson` varchar(255) DEFAULT NULL,
  `vendorName` int(11) NOT NULL,
  `contactEmail` varchar(255) DEFAULT NULL,
  `contactPhone` varchar(255) DEFAULT NULL,
  `vendorInformation` varchar(255) DEFAULT NULL,
  `billingAddress` varchar(255) DEFAULT NULL,
  `paymentMethod` varchar(255) DEFAULT NULL,
  `deliverType` varchar(255) DEFAULT NULL,
  `requestDate` datetime DEFAULT NULL,
  `emergencyContact` varchar(255) DEFAULT NULL,
  `deliveryDate` datetime DEFAULT NULL,
  `requestType` varchar(255) DEFAULT NULL,
  `priority` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `unitPrice` decimal(10,0) DEFAULT NULL,
  `totalCost` decimal(10,0) DEFAULT NULL,
  `serviceDescription` varchar(255) DEFAULT NULL,
  `relatedDocuments` varchar(255) DEFAULT NULL,
  `legalCompliance` varchar(255) DEFAULT NULL,
  `urgencyLevel` varchar(255) DEFAULT NULL,
  `shippingInformation` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `sequelizemeta`
--

INSERT INTO `sequelizemeta` (`name`) VALUES
('20240527193133-create-customers-table.js'),
('20240527200657-create-users-table.js'),
('20240527201934-create-orders-table.js'),
('20240527202017-create-addresses-table.js'),
('20240527202215-create-locations-table.js'),
('20240527202303-create-areas-table.js'),
('20240527202403-create-carts-table.js'),
('20240527202449-create-categories-table.js'),
('20240527202541-create-payments-table.js'),
('20240527202643-create-subcategories-table.js'),
('20240527202717-create-subchildcategories-table.js'),
('20240527202745-create-products-table.js'),
('20240527202824-create-productoffers-table.js'),
('20240527202900-create-productphotos-table.js'),
('20240527203037-create-vendors-table.js'),
('20240527203110-create-vendorareas-table.js'),
('20240527203127-create-vendorproducts-table.js'),
('20240704185201-create-vendorStock.js'),
('20240704192035-create-vendorStock.js'),
('20240707093958-creating_stocktable-vendors.js'),
('20240707101932-creating_stocktable-vendors.js'),
('20240721133703-create-store.js'),
('20240721141529-create-store-area.js'),
('20240721145131-create-store-products.js'),
('20240721173616-create-store-products.js'),
('20240721174503-add-multiple-columns-to-vendor.js'),
('20240721175732-add-multiple-columns-to-store.js'),
('20240725181148-create-request-store.js'),
('20240804121141-update-vendor-columns.js'),
('20240806153356-add-column-to-product.js'),
('20240825075201-add-column-to-categories.js'),
('20240825081725-add-column-to-products.js'),
('20240826171559-add-column-to-store.js'),
('20240829184054-creating-products-table.js'),
('20240922124437-create-productFeedback.js'),
('20240926170348-create-scubscription.js'),
('20240926181114-create-ad.js'),
('20240927200555-add-new-column-to-product.js');

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
  `id` int(11) NOT NULL,
  `storename` varchar(255) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `storeaddress` text DEFAULT NULL,
  `storedesc` text DEFAULT NULL,
  `ownername` varchar(255) DEFAULT NULL,
  `owneraddress` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` text DEFAULT NULL,
  `areaId` int(11) DEFAULT NULL,
  `accountNo` varchar(255) DEFAULT NULL,
  `accountHolderName` varchar(255) DEFAULT NULL,
  `bankName` varchar(255) DEFAULT NULL,
  `IFSC` varchar(255) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `adharCardNo` int(11) DEFAULT NULL,
  `panCardNo` varchar(255) DEFAULT NULL,
  `GSTNo` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `website` varchar(255) DEFAULT NULL,
  `storeImage` varchar(255) DEFAULT NULL,
  `openTime` varchar(255) DEFAULT NULL,
  `closeTime` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stores`
--

INSERT INTO `stores` (`id`, `storename`, `status`, `storeaddress`, `storedesc`, `ownername`, `owneraddress`, `email`, `password`, `phone`, `areaId`, `accountNo`, `accountHolderName`, `bankName`, `IFSC`, `branch`, `adharCardNo`, `panCardNo`, `GSTNo`, `createdAt`, `updatedAt`, `website`, `storeImage`, `openTime`, `closeTime`, `location`) VALUES
(31, 'NickName InfoTech', 1, '15/3,T Nagar, Chennai, Tamil Nadu 600017\r\napartment', 'this is Organics Products. to make pure', 'rasu', '15/3,T Nagar, Chennai, Tamil Nadu 600017\r\napartment', 'rasu3@gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-23 07:54:42', '2024-12-16 05:48:44', 'https://nicknameportal.shop/', 'uploads/storeImage_1734327235496.jpg', '10.am', '5pm', '26MJ+4V3 Chennai, Tamil Nadu'),
(32, 'mani', 1, 'pallavanagar', 'one lift next right', 'chinna', 't nagar', 'chin@332gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-23 09:51:34', '2024-11-23 10:40:04', 'nickname infotch', 'uploads/storeImage_1732358404286.jpg', '10.10', '12', 'mellnalathur'),
(33, 'prathap', 1, 'funny', 'videos', 'prathap', 'valaimaram', 'phin@332gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-23 11:25:08', '2024-11-23 16:54:22', 'video share.com', 'uploads/storeImage_1732380862817.jpg', '10', '8', 'kurukkupettai'),
(34, 'kavi', 1, 'jaja nager chennai', 'stight forward', 'kavi', 'chennai', 'khin@332gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-23 11:27:51', '2024-11-26 07:11:03', 'statup company', 'uploads/storeImage_1732605063712.jpg', '10', '5pm', 'sriperumbuthur'),
(35, 'lakshumi productivity', 1, 'ramapuram', 'one way', 'lakshumi productivity', 'chennai', 'lhin@332gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-26 07:21:10', '2024-11-26 07:38:22', 'lax.com', 'uploads/storeImage_1732606702322.jpg', '10', '8', 'chennai'),
(36, 'perfume', 1, 'america', 'product', 'pafims ', 'chennai', 'fhin@332gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-26 07:24:54', '2024-11-26 08:02:04', 'perfume .com', 'uploads/storeImage_1732608124854.jpg', '10', '8', 'word sctiy'),
(37, 'charger', 1, 'richisteet', 'chennai', 'charger', 'thiruvallur', 'ahin@332gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-26 07:26:44', '2024-11-26 09:48:41', 'ertyuhijokppolihkujyesdfrcgvhyg', 'uploads/storeImage_1732614521311.jpg', '10', '8', 'sriperumbuthur'),
(38, 'bags', 1, 'tambaram', 'main rod', 'raies bag', 'chennai', 'bagn@332gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-26 07:28:10', '2024-11-26 10:06:09', 'raies bag', 'uploads/storeImage_1732614833367.webp', '10', '8', 'tambaram'),
(39, 'sakthi massl', 1, 'amgr nager', 'main rod', 'sakthi massl', 'mathurai', 'sakth@332gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-26 07:29:34', '2024-11-26 10:19:35', 'sakthimasala', 'uploads/storeImage_1732616375339.jpg', '10', '8', 'anna nagar'),
(40, 'appolo medical', 1, 'chennai to pandicheri rod apoplo ', 'main rod ', 'appolo medical', 'chennai', 'medical@332gamil.com', 'chin@332', '7667050691', 3, 'null', 'null', 'null', 'null', 'null', 0, 'null', 'null', '2024-11-26 07:30:45', '2024-11-26 10:23:23', 'apoplo .com', 'uploads/storeImage_1732616603016.jpg', '10', '8', 'apdhul nagar'),
(41, 'kumaran furnichars', 0, NULL, NULL, 'kumaran furnichars', NULL, 'kumaran@332gamil.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-26 07:31:47', '2024-11-26 07:31:47', NULL, '', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `store_areas`
--

CREATE TABLE `store_areas` (
  `id` int(11) NOT NULL,
  `storeId` int(11) NOT NULL,
  `areaId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `store_products`
--

CREATE TABLE `store_products` (
  `id` int(11) NOT NULL,
  `supplierId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `price` int(11) DEFAULT NULL,
  `unitSize` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `store_products`
--

INSERT INTO `store_products` (`id`, `supplierId`, `productId`, `price`, `unitSize`, `createdAt`, `updatedAt`) VALUES
(22, 31, 82, 120000, 30, '2024-11-23 10:06:56', '2024-11-23 10:06:56'),
(23, 32, 83, 120000, 30, '2024-11-23 10:15:19', '2024-11-23 10:15:19'),
(24, 32, 84, 120000, 30, '2024-11-23 10:29:17', '2024-11-23 10:29:17'),
(25, 32, 85, 40000, 10, '2024-11-23 10:30:47', '2024-11-23 10:30:47'),
(26, 32, 86, 240, 30, '2024-11-23 10:33:26', '2024-11-23 10:33:26'),
(27, 32, 90, 120000, 30, '2024-11-23 10:35:55', '2024-11-23 10:35:55'),
(28, 32, 91, 4000000, 1000, '2024-11-23 10:38:00', '2024-11-23 10:38:00'),
(29, 31, 94, 240, 30, '2024-11-23 10:59:00', '2024-11-23 10:59:00'),
(30, 33, 97, 120000, 30, '2024-11-23 17:02:06', '2024-11-23 17:02:06'),
(31, 33, 98, 120000, 30, '2024-11-23 17:09:04', '2024-11-23 17:09:04'),
(32, 33, 101, 120000, 30, '2024-11-23 17:11:23', '2024-11-23 17:11:23'),
(33, 33, 102, 120000, 30, '2024-11-23 17:12:39', '2024-11-23 17:12:39'),
(34, 33, 103, 120000, 30, '2024-11-23 17:17:06', '2024-11-23 17:17:06'),
(35, 35, 108, 120000, 30, '2024-11-26 07:42:29', '2024-11-26 07:42:29'),
(36, 35, 109, 120000, 30, '2024-11-26 07:45:09', '2024-11-26 07:45:09'),
(37, 35, 110, 120000, 30, '2024-11-26 07:47:52', '2024-11-26 07:47:52'),
(38, 35, 111, 480, 30, '2024-11-26 07:49:13', '2024-11-26 07:49:13'),
(39, 35, 112, 120000, 30, '2024-11-26 07:50:10', '2024-11-26 07:50:10'),
(40, 35, 113, 120000, 30, '2024-11-26 07:51:29', '2024-11-26 07:51:29'),
(41, 35, 114, 120000, 30, '2024-11-26 07:52:41', '2024-11-26 07:52:41'),
(42, 36, 115, 120000, 30, '2024-11-26 08:08:50', '2024-11-26 08:08:50'),
(43, 36, 116, 120000, 30, '2024-11-26 08:10:33', '2024-11-26 08:10:33'),
(44, 36, 117, 120000, 30, '2024-11-26 08:15:42', '2024-11-26 08:15:42'),
(45, 36, 118, 120000, 30, '2024-11-26 08:18:48', '2024-11-26 08:18:48'),
(46, 36, 119, 120000, 30, '2024-11-26 08:20:03', '2024-11-26 08:20:03'),
(47, 36, 120, 120000, 30, '2024-11-26 08:21:11', '2024-11-26 08:21:11'),
(48, 36, 121, 120000, 30, '2024-11-26 08:22:20', '2024-11-26 08:22:20'),
(49, 36, 122, 120000, 30, '2024-11-26 08:23:45', '2024-11-26 08:23:45'),
(50, 36, 123, 120000, 30, '2024-11-26 08:24:49', '2024-11-26 08:24:49'),
(51, 34, 124, 120000, 30, '2024-11-26 08:36:15', '2024-11-26 08:36:15'),
(52, 34, 125, 120000, 30, '2024-11-26 08:38:18', '2024-11-26 08:38:18'),
(53, 34, 126, 120000, 30, '2024-11-26 09:18:32', '2024-11-26 09:18:32'),
(54, 34, 127, 120000, 30, '2024-11-26 09:19:33', '2024-11-26 09:19:33'),
(55, 34, 128, 120000, 30, '2024-11-26 09:21:03', '2024-11-26 09:21:03'),
(56, 34, 129, 120000, 30, '2024-11-26 09:22:38', '2024-11-26 09:22:38'),
(57, 34, 130, 120000, 30, '2024-11-26 09:23:46', '2024-11-26 09:23:46'),
(58, 34, 131, 120000, 30, '2024-11-26 09:24:45', '2024-11-26 09:24:45'),
(59, 31, 132, 120000, 30, '2024-11-26 09:32:32', '2024-11-26 09:32:32'),
(60, 31, 133, 120000, 30, '2024-11-26 09:33:20', '2024-11-26 09:33:20'),
(61, 31, 134, 120000, 30, '2024-11-26 09:34:11', '2024-11-26 09:34:11'),
(62, 31, 135, 120000, 30, '2024-11-26 09:35:12', '2024-11-26 09:35:12'),
(63, 31, 136, 120000, 30, '2024-11-26 09:36:07', '2024-11-26 09:36:07'),
(64, 31, 137, 120000, 30, '2024-11-26 09:37:09', '2024-11-26 09:37:09'),
(65, 37, 138, 120000, 30, '2024-11-26 09:56:39', '2024-11-26 09:56:39'),
(66, 37, 139, 120000, 30, '2024-11-26 09:58:01', '2024-11-26 09:58:01'),
(67, 37, 140, 120000, 30, '2024-11-26 09:59:02', '2024-11-26 09:59:02'),
(68, 37, 141, 120000, 30, '2024-11-26 10:00:12', '2024-11-26 10:00:12'),
(69, 37, 142, 120000, 30, '2024-11-26 10:01:15', '2024-11-26 10:01:15'),
(70, 37, 143, 120000, 30, '2024-11-26 10:02:15', '2024-11-26 10:02:15'),
(71, 37, 144, 120000, 30, '2024-11-26 10:03:18', '2024-11-26 10:03:18'),
(72, 38, 145, 120000, 30, '2024-11-26 10:09:06', '2024-11-26 10:09:06'),
(73, 32, 164, 120000, 30, '2024-11-26 10:29:40', '2024-11-26 10:29:40'),
(74, 32, 165, 120000, 30, '2024-11-26 10:30:38', '2024-11-26 10:30:38'),
(75, 32, 166, 120000, 30, '2024-11-26 10:31:17', '2024-11-26 10:31:17'),
(76, 32, 177, 120000, 30, '2024-11-26 10:35:39', '2024-11-26 10:35:39'),
(77, 32, 178, 120000, 30, '2024-11-26 10:36:33', '2024-11-26 10:36:33'),
(78, 32, 179, 120000, 30, '2024-11-26 10:37:40', '2024-11-26 10:37:40'),
(79, 32, 180, 120000, 30, '2024-11-26 10:39:00', '2024-11-26 10:39:00'),
(80, 38, 181, 120000, 30, '2024-11-26 10:44:28', '2024-11-26 10:44:28'),
(81, 38, 182, 120000, 30, '2024-11-26 10:45:19', '2024-11-26 10:45:19'),
(82, 38, 183, 120000, 30, '2024-11-26 10:46:06', '2024-11-26 10:46:06'),
(83, 38, 184, 120000, 30, '2024-11-26 10:46:54', '2024-11-26 10:46:54'),
(84, 38, 185, 120000, 30, '2024-11-26 10:47:48', '2024-11-26 10:47:48'),
(85, 38, 186, 120000, 30, '2024-11-26 10:48:52', '2024-11-26 10:48:52'),
(86, 38, 187, 120000, 30, '2024-11-26 10:49:56', '2024-11-26 10:49:56'),
(87, 38, 188, 120000, 30, '2024-11-26 10:50:49', '2024-11-26 10:50:49'),
(88, 39, 189, 120000, 30, '2024-11-26 11:00:06', '2024-11-26 11:00:06'),
(89, 39, 190, 120000, 30, '2024-11-26 11:01:39', '2024-11-26 11:01:39'),
(90, 39, 191, 120000, 30, '2024-11-26 11:02:40', '2024-11-26 11:02:40'),
(91, 39, 192, 120000, 30, '2024-11-26 11:03:35', '2024-11-26 11:03:35'),
(92, 39, 193, 120000, 30, '2024-11-26 11:04:42', '2024-11-26 11:04:42'),
(93, 39, 194, 120000, 30, '2024-11-26 11:05:41', '2024-11-26 11:05:41'),
(94, 39, 195, 120000, 30, '2024-11-26 11:06:34', '2024-11-26 11:06:34'),
(95, 39, 196, 120000, 30, '2024-11-26 11:07:34', '2024-11-26 11:07:34'),
(96, 39, 197, 120000, 30, '2024-11-26 11:08:29', '2024-11-26 11:08:29'),
(97, 40, 198, 120000, 30, '2024-11-26 11:14:09', '2024-11-26 11:14:09'),
(98, 40, 199, 120000, 30, '2024-11-26 11:15:11', '2024-11-26 11:15:11'),
(99, 40, 200, 120000, 30, '2024-11-26 11:16:19', '2024-11-26 11:16:19'),
(100, 40, 201, 120000, 30, '2024-11-26 11:17:20', '2024-11-26 11:17:20'),
(101, 40, 202, 120000, 30, '2024-11-26 11:18:16', '2024-11-26 11:18:16'),
(102, 36, 204, 120000, 30, '2024-11-26 16:04:07', '2024-11-26 16:04:07');

-- --------------------------------------------------------

--
-- Table structure for table `subcategories`
--

CREATE TABLE `subcategories` (
  `id` int(11) NOT NULL,
  `sub_name` varchar(255) DEFAULT NULL,
  `categoryId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subcategories`
--

INSERT INTO `subcategories` (`id`, `sub_name`, `categoryId`, `createdAt`, `updatedAt`) VALUES
(3, 'Portal', 28, '2024-11-17 11:57:13', '2024-11-17 11:57:13');

-- --------------------------------------------------------

--
-- Table structure for table `subchildcategories`
--

CREATE TABLE `subchildcategories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `categoryId` int(11) NOT NULL,
  `subcategoryId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subchildcategories`
--

INSERT INTO `subchildcategories` (`id`, `name`, `categoryId`, `subcategoryId`, `createdAt`, `updatedAt`) VALUES
(3, 'ProtalChild', 28, 3, '2024-11-17 11:58:51', '2024-11-17 11:58:51');

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `subscriptionType` varchar(255) NOT NULL,
  `subscriptionPlan` varchar(255) NOT NULL,
  `subscriptionPrice` decimal(10,2) NOT NULL,
  `customerId` int(11) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `subscriptionCount` int(11) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `subscriptionType`, `subscriptionPlan`, `subscriptionPrice`, `customerId`, `status`, `subscriptionCount`, `createdAt`, `updatedAt`) VALUES
(19, 'Plan1', 'PL1_001', 95.00, 32, '1', 5, '2024-11-18 18:12:08', '2024-11-18 18:12:08'),
(20, 'Plan2', 'PL1_001', 95.00, 32, '1', 5, '2024-12-22 11:44:02', '2024-12-22 11:44:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `verify` tinyint(1) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `vendorId` varchar(255) DEFAULT '',
  `storeId` varchar(255) DEFAULT '',
  `plan` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `firstName`, `lastName`, `address`, `email`, `phone`, `role`, `verify`, `password`, `createdAt`, `updatedAt`, `vendorId`, `storeId`, `plan`) VALUES
(41, 'chinna', NULL, NULL, 'arulkumar@123.com', '1234567890', '2', 1, '$2a$10$l/UwXIH73zhOnhOIn.pZk.OJpB95439.9ua4WB7Zx3iP/LEsvMIuG', '2024-11-22 18:36:57', '2024-11-26 14:54:35', '44', '', ''),
(48, 'vellumurugan', NULL, NULL, 'admin@portal.com', '8270564998', '0', 1, '$2a$10$I0.cd1KOrrAILAOHSdmvq.U6KgEwSRw5JxKs0cFxNRbhu9VT3LRP2', '2024-11-22 18:46:35', '2024-11-26 15:32:21', NULL, '', ''),
(53, 'chinna', NULL, NULL, 'chinna3@gamil.com', '766705061', '2', 1, '$2a$10$tfdrLjrsTGYlsT8/UPlaCe9WXYHmRrtw1rL.M3H13BydcFUIwFdsu', '2024-11-23 07:00:38', '2024-11-26 14:54:35', '44', '', ''),
(54, 'rasu', NULL, NULL, 'rasu3@gamil.com', '7667050691', '3', 1, '$2a$10$ppeowKGFWqxxC7OuyQarquwRtqSyX2FyXY0E1OMQ2Rogq7Q8gDVAW', '2024-11-23 07:54:42', '2024-12-16 05:48:44', '', '31', ''),
(55, 'chinna', NULL, NULL, 'chin@332gamil.com', '7667050691', '3', 1, '$2a$10$hJOEsUuDWlUSAr/vzDgGfulEem/MBQIfC3ReY5IZjOjd1V9gaQBni', '2024-11-23 09:51:34', '2024-11-23 10:40:04', '', '32', ''),
(56, 'sathish', NULL, NULL, 'shin@332gamil.com', '7667050691', '2', 1, '$2a$10$Hd8Ym7g2X2NE2K1U6fjbMe57hOIGq5ba/RqBQq2QIfM.BAqyVGyqW', '2024-11-23 11:07:22', '2024-11-23 16:32:06', '45', '', ''),
(57, 'tamil', NULL, NULL, 'thin@332gamil.com', '7667050691', '2', 1, '$2a$10$f0P2jSFXhw7KDAtaKkKDlOpqfLYUG90PT0arJ8LoLqlWjzkW1PwC2', '2024-11-23 11:09:57', '2024-11-27 16:32:17', '46', '', ''),
(58, 'guna', NULL, NULL, 'ghin@332gamil.com', '7667050691', '1', 1, '$2a$10$lNbSETxWERhHVr2TTRdFP.ndcwZog5uiRTAthTd9HUem9.XSCHdJW', '2024-11-23 11:15:18', '2024-11-23 11:15:18', '', '', ''),
(59, 'prathap', NULL, NULL, 'phin@332gamil.com', '7667050691', '3', 1, '$2a$10$BDVcsOxJ1Y/tNnVxXq6GCOW4Ln1XAELxbOdVuRGp4lq.xWIUE/JWi', '2024-11-23 11:25:08', '2024-11-23 16:54:23', '', '33', ''),
(60, 'kavi', NULL, NULL, 'khin@332gamil.com', '7667050691', '3', 1, '$2a$10$m433RUwdSCr9KKOt4pY07.WDQHwhC8VPlY6WQahJh8MPXbzTeT6xm', '2024-11-23 11:27:51', '2024-11-26 07:11:04', '', '34', ''),
(61, 'baskar', NULL, NULL, 'bhin@332gamil.com', '7667050691', '2', 1, '$2a$10$MB56lLddw3CtTuwWzhWxj.xYp6rmtZ4V3.elFJaoPa5JTtg9cBW32', '2024-11-23 11:34:21', '2024-11-23 16:44:59', '47', '', ''),
(62, 'vinth', NULL, NULL, 'vhin@332gamil.com', '7667050691', '2', 1, '$2a$10$nj.hIdvaveNzDdhoHZu9hOZigrXVfZtF49Zq2jkvkH69u2dz7FVry', '2024-11-23 16:28:51', '2024-11-26 16:27:31', '48', '', ''),
(63, 'lakshumi productivity', NULL, NULL, 'lhin@332gamil.com', '7667050691', '3', 1, '$2a$10$rGxQw5RIWXJa.8C.zEzKlO05HFf7FY5v1cXxBhh5uah4SFNPtMtne', '2024-11-26 07:21:10', '2024-11-26 07:38:22', '', '35', ''),
(64, 'pafims', NULL, NULL, 'fhin@332gamil.com', '7667050691', '3', 1, '$2a$10$bkmrg/tZYpNJaObqpD/ZDO.i7YEPb3NFi29kpDCBDmrS7gLeD/yyS', '2024-11-26 07:24:54', '2024-11-26 08:02:05', '', '36', ''),
(65, 'charger', NULL, NULL, 'ahin@332gamil.com', '7667050691', '3', 1, '$2a$10$dhTAdJtviKe5VQ8yZWSnK.8HmlGYgJjYrZIzPvnotyciWVaNAxY6W', '2024-11-26 07:26:44', '2024-11-26 09:48:41', '', '37', ''),
(66, 'raies bag', NULL, NULL, 'bagn@332gamil.com', '7667050691', '3', 1, '$2a$10$d.dTUklLNF4qah94KnCVSe/IYC3/L4V4HbEkdlMt/cBrvG/esOg3a', '2024-11-26 07:28:10', '2024-11-26 10:06:09', '', '38', ''),
(67, 'sakthi massl', NULL, NULL, 'sakth@332gamil.com', '7667050691', '3', 1, '$2a$10$2IhahuXcrRkD0yU3cHQfuuAU6jFGt9KXS2u2fITwVl36Jmqk5po/C', '2024-11-26 07:29:34', '2024-11-26 10:19:35', '', '39', ''),
(68, 'appolo medical', NULL, NULL, 'medical@332gamil.com', '7667050691', '3', 1, '$2a$10$P.y0Qhg3/N5EvP4mQZ6fKOo4cxpYLmIGoXie5KQnYuLO9f6vmbX/m', '2024-11-26 07:30:45', '2024-11-26 10:23:23', '', '40', ''),
(69, 'kumaran furnichars', NULL, NULL, 'kumaran@332gamil.com', '7667050691', '3', 0, '$2a$10$8Nx3RigzEWaZB6ckSmjpaeFjwjlxLQiT.gPsWf2NXWwBxZ7Lobwq6', '2024-11-26 07:31:46', '2024-11-26 07:31:47', '', '41', ''),
(70, 'govind', NULL, NULL, 'govind@332gamil.com', '7667050691', '2', 0, '$2a$10$J6/SpiTGLLyEZJ2A7nPqb.y6uhk5siIBecu8/kcm12AHvMqKgV.LO', '2024-11-26 15:26:03', '2024-11-26 15:26:04', '49', '', ''),
(71, 'babu', NULL, NULL, 'babu@332gamil.com', '7667050691', '2', 1, '$2a$10$9lQqWgShzUGZzs/FQSjU1OfacaJxoFOas8CcFXEFLnlWJdrZzVSYG', '2024-11-26 15:31:07', '2024-11-27 16:24:17', '50', '', ''),
(72, 'vellumurugan', NULL, NULL, 'vellu@332gamil.com', '7667050691', '2', 1, '$2a$10$LZo3kGIGIshr2EyvBSsdzeOQiJb63QeJoHam8UNhpsNjgdvfsCaIO', '2024-11-26 15:32:21', '2024-11-27 16:51:23', '51', '', ''),
(73, 'prasanth', NULL, NULL, 'pras@332gamil.com', '7667050691', '2', 0, '$2a$10$POTgkXwAb0nkGXGQQstKx.smN40PcgRtVatzFVTJs59g16P5ZEh8O', '2024-11-26 15:33:47', '2024-11-26 15:33:47', '52', '', ''),
(74, 'paranthman', NULL, NULL, 'para@332gamil.com', '7667050691', '2', 0, '$2a$10$tRnJjVG2Rstsuddx6gomDO0v85IWmM3Idgc/iFR8OPokTd.cwJbzS', '2024-11-26 15:35:10', '2024-11-26 15:35:11', '53', '', ''),
(75, 'kavitha', NULL, NULL, 'kavi@332gamil.com', '7667050691', '2', 0, '$2a$10$TAzdAfDvjn4wzpcTZVdxZu6w/2V1M.jeXH4CU1r6BhIW/cULn5JzC', '2024-11-26 15:37:07', '2024-11-26 15:37:08', '54', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `storename` varchar(255) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `shopaddress` text DEFAULT NULL,
  `shopdesc` text DEFAULT NULL,
  `ownername` varchar(255) DEFAULT NULL,
  `owneraddress` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` text DEFAULT NULL,
  `areaId` int(11) NOT NULL,
  `accountNo` varchar(255) DEFAULT NULL,
  `accountHolderName` varchar(255) DEFAULT NULL,
  `bankName` varchar(255) DEFAULT NULL,
  `IFSC` varchar(255) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `adharCardNo` int(11) DEFAULT NULL,
  `panCardNo` varchar(255) DEFAULT NULL,
  `GSTNo` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `website` varchar(255) DEFAULT NULL,
  `location` varchar(300) DEFAULT NULL,
  `vendorImage` varchar(255) DEFAULT NULL,
  `openTime` varchar(255) DEFAULT NULL,
  `closeTime` varchar(255) DEFAULT NULL,
  `plan` varchar(255) DEFAULT NULL,
  `cashPayment` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `storename`, `status`, `shopaddress`, `shopdesc`, `ownername`, `owneraddress`, `email`, `password`, `phone`, `areaId`, `accountNo`, `accountHolderName`, `bankName`, `IFSC`, `branch`, `adharCardNo`, `panCardNo`, `GSTNo`, `createdAt`, `updatedAt`, `website`, `location`, `vendorImage`, `openTime`, `closeTime`, `plan`, `cashPayment`) VALUES
(44, 'chinna', 1, 'pallavan nagar', 'rod side fist stor', 'chinna', 'melnalathur', 'chinna3@gamil.com', 'chin@332', '766705061', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-23 07:00:38', '2024-11-26 14:54:35', 'nicnameinfotch', 'https://maps.app.goo.gl/PNrxymwDG8iwUu9s9', 'uploads/vendorImage_1732632875624.jpg', '10.am', '2.pm', NULL, NULL),
(45, 'sathish', 1, 'chennai', 'all model availabale', 'sathish', 'vellor main rod', 'shin@332gamil.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-23 11:07:22', '2024-11-23 16:32:06', 'sthish .com', 'anna nagar', 'uploads/vendorImage_1732360754195.jpg', '10', '8', NULL, NULL),
(46, 'tamil', 1, 'gudiyatham', 'como off', 'tamil', 'thiruvallur', 'thin@332gamil.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-23 11:09:57', '2024-11-27 16:32:17', 'ertyuhijokppolihkujyesdfrcgvhyg', 'anna nagar', 'uploads/vendorImage_1732725137253.jpg', '10', '8', NULL, NULL),
(47, 'baskar', 1, 'vellor', ' i have sale one protact', 'baskar', 'pattarai', 'bhin@332gamil.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-23 11:34:21', '2024-11-23 16:44:59', 'baskar .com', 'kanthi nagar', 'uploads/vendorImage_1732380299253.webp', '10', '8', NULL, NULL),
(48, 'vinth', 1, 'sai shop', 'make new one', 'vinth', 'perumal nagar', 'vhin@332gamil.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-23 16:28:51', '2024-11-26 16:27:31', 'statup company', 'sriperumbuthur', 'uploads/vendorImage_1732380499884.jpg', '10', '8', NULL, NULL),
(49, 'govind', 1, 'No 22, Pallavan St, Ambal Nagar, Ekkatuthangal,', '34523', 'govind', 'null', 'nicknameinfotech2020@gmail.com', 'chin@332', '08270560889', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-26 15:26:03', '2024-11-26 18:06:26', 'asdfasd', '23452', 'uploads/vendorImage_1732644386232.png', '12', '12', NULL, NULL),
(50, 'babu', 1, 'gudiyatham', 'over all india', 'babu', 'null', 'babu@332gamil.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-26 15:31:07', '2024-11-27 16:24:17', 'all india .com', 'anna nagar', 'uploads/vendorImage_1732724657078.jpg', '10', '8', NULL, NULL),
(51, 'NickName InfoTech', 1, '15/3,T Nagar, Chennai, Tamil Nadu 600017\r\napartment', 'this is Organics Products. to make pure', 'chinnarasu', '15/3,T Nagar, Chennai, Tamil Nadu 600017\r\napartment', 'chinnrasukuppan@gmail.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-26 15:32:21', '2024-12-16 05:10:03', 'https://nicknameportal.shop/', '26MJ+4V3 Chennai, Tamil Nadu', 'uploads/vendorImage_1732724771379.jpg', '10', '8', NULL, NULL),
(52, 'prasanth ', 0, NULL, NULL, 'prasanth ', NULL, 'pras@332gamil.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-26 15:33:47', '2024-11-26 15:33:47', NULL, NULL, '', NULL, NULL, NULL, NULL),
(53, 'paranthman', 0, NULL, NULL, 'paranthman', NULL, 'para@332gamil.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-26 15:35:10', '2024-11-26 15:35:10', NULL, NULL, '', NULL, NULL, NULL, NULL),
(54, 'kavitha', 0, NULL, NULL, 'kavitha', NULL, 'kavi@332gamil.com', 'chin@332', '7667050691', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-26 15:37:07', '2024-11-26 15:37:07', NULL, NULL, '', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vendorstocks`
--

CREATE TABLE `vendorstocks` (
  `id` int(11) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `vendorId` int(11) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendor_areas`
--

CREATE TABLE `vendor_areas` (
  `id` int(11) NOT NULL,
  `vendorId` int(11) NOT NULL,
  `areaId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendor_areas`
--

INSERT INTO `vendor_areas` (`id`, `vendorId`, `areaId`, `createdAt`, `updatedAt`) VALUES
(41, 44, 3, '2024-11-23 07:00:38', '2024-11-23 07:00:38'),
(42, 45, 3, '2024-11-23 11:07:22', '2024-11-23 11:07:22'),
(43, 46, 3, '2024-11-23 11:09:57', '2024-11-23 11:09:57'),
(44, 47, 3, '2024-11-23 11:34:21', '2024-11-23 11:34:21'),
(45, 48, 3, '2024-11-23 16:28:51', '2024-11-23 16:28:51'),
(46, 49, 3, '2024-11-26 15:26:03', '2024-11-26 15:26:03'),
(47, 50, 3, '2024-11-26 15:31:07', '2024-11-26 15:31:07'),
(48, 51, 3, '2024-11-26 15:32:21', '2024-11-26 15:32:21'),
(49, 52, 3, '2024-11-26 15:33:47', '2024-11-26 15:33:47'),
(50, 53, 3, '2024-11-26 15:35:10', '2024-11-26 15:35:10'),
(51, 54, 3, '2024-11-26 15:37:07', '2024-11-26 15:37:07');

-- --------------------------------------------------------

--
-- Table structure for table `vendor_products`
--

CREATE TABLE `vendor_products` (
  `id` int(11) NOT NULL,
  `supplierId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `price` int(11) DEFAULT NULL,
  `unitSize` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendor_products`
--

INSERT INTO `vendor_products` (`id`, `supplierId`, `productId`, `price`, `unitSize`, `createdAt`, `updatedAt`) VALUES
(7, 46, 104, 120000, 30, '2024-11-23 17:18:18', '2024-11-23 17:18:18'),
(8, 46, 105, 120000, 30, '2024-11-23 17:19:26', '2024-11-23 17:19:26'),
(9, 46, 106, 120000, 30, '2024-11-23 17:20:20', '2024-11-23 17:20:20'),
(10, 46, 107, 120000, 30, '2024-11-23 17:21:15', '2024-11-23 17:21:15'),
(11, 48, 203, 120000, 30, '2024-11-26 15:44:45', '2024-11-26 15:44:45'),
(12, 48, 205, 120000, 30, '2024-11-26 16:17:54', '2024-11-26 16:17:54'),
(13, 45, 206, 120000, 30, '2024-11-26 16:32:41', '2024-11-26 16:32:41'),
(14, 45, 207, 120000, 30, '2024-11-27 16:13:36', '2024-11-27 16:13:36'),
(15, 45, 208, 120000, 30, '2024-11-27 16:15:00', '2024-11-27 16:15:00'),
(16, 45, 209, 120000, 30, '2024-11-27 16:15:57', '2024-11-27 16:15:57'),
(17, 45, 210, 120000, 30, '2024-11-27 16:17:17', '2024-11-27 16:17:17'),
(18, 45, 211, 120000, 30, '2024-11-27 16:18:17', '2024-11-27 16:18:17'),
(19, 45, 212, 120000, 30, '2024-11-27 16:19:10', '2024-11-27 16:19:10'),
(20, 45, 213, 120000, 30, '2024-11-27 16:20:09', '2024-11-27 16:20:09'),
(21, 46, 220, 120000, 30, '2024-11-27 16:39:35', '2024-11-27 16:39:35'),
(22, 46, 221, 120000, 30, '2024-11-27 16:40:44', '2024-11-27 16:40:44'),
(23, 46, 222, 120000, 30, '2024-11-27 16:41:47', '2024-11-27 16:41:47'),
(24, 46, 223, 120000, 30, '2024-11-27 16:43:32', '2024-11-27 16:43:32'),
(25, 47, 227, 120000, 30, '2024-11-27 16:56:55', '2024-11-27 16:56:55'),
(26, 47, 228, 120000, 30, '2024-11-27 16:57:49', '2024-11-27 16:57:49'),
(27, 47, 229, 120000, 30, '2024-11-27 16:58:45', '2024-11-27 16:58:45'),
(28, 47, 230, 120000, 30, '2024-11-27 16:59:32', '2024-11-27 16:59:32'),
(29, 47, 234, 120000, 30, '2024-11-27 17:02:45', '2024-11-27 17:02:45'),
(30, 47, 235, 120000, 30, '2024-11-27 17:03:41', '2024-11-27 17:03:41'),
(31, 48, 236, 120000, 30, '2024-11-27 17:08:15', '2024-11-27 17:08:15'),
(32, 48, 237, 120000, 30, '2024-11-27 17:09:03', '2024-11-27 17:09:03'),
(33, 48, 238, 120000, 30, '2024-11-27 17:09:46', '2024-11-27 17:09:46'),
(34, 48, 239, 120000, 30, '2024-11-27 17:10:36', '2024-11-27 17:10:36'),
(35, 48, 240, 120000, 30, '2024-11-27 17:11:27', '2024-11-27 17:11:27'),
(36, 48, 241, 120000, 30, '2024-11-27 17:12:14', '2024-11-27 17:12:14'),
(37, 50, 242, 120000, 30, '2024-11-27 17:16:54', '2024-11-27 17:16:54'),
(38, 50, 243, 120000, 30, '2024-11-27 17:17:41', '2024-11-27 17:17:41'),
(39, 50, 244, 120000, 30, '2024-11-27 17:18:26', '2024-11-27 17:18:26'),
(40, 50, 245, 120000, 30, '2024-11-27 17:19:15', '2024-11-27 17:19:15'),
(41, 50, 246, 120000, 30, '2024-11-27 17:20:16', '2024-11-27 17:20:16'),
(42, 50, 249, 120000, 30, '2024-11-27 17:21:06', '2024-11-27 17:21:06'),
(43, 50, 250, 120000, 30, '2024-11-27 17:21:47', '2024-11-27 17:21:47'),
(44, 51, 251, 120000, 30, '2024-11-27 17:25:58', '2024-11-27 17:25:58'),
(45, 51, 252, 120000, 30, '2024-11-27 17:26:41', '2024-11-27 17:26:41'),
(46, 51, 253, 120000, 30, '2024-11-27 17:27:22', '2024-11-27 17:27:22'),
(47, 51, 254, 120000, 30, '2024-11-27 17:28:11', '2024-11-27 17:28:11'),
(48, 51, 257, 120000, 30, '2024-11-27 17:29:31', '2024-11-27 17:29:31'),
(49, 51, 258, 120000, 30, '2024-11-27 17:30:21', '2024-11-27 17:30:21'),
(50, 51, 259, 120000, 30, '2024-11-27 17:31:23', '2024-11-27 17:31:23'),
(51, 51, 260, 120000, 30, '2024-11-27 17:32:16', '2024-11-27 17:32:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orderId` (`orderId`),
  ADD KEY `custId` (`custId`);

--
-- Indexes for table `ads`
--
ALTER TABLE `ads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `areas`
--
ALTER TABLE `areas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `locationId` (`locationId`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orderId` (`orderId`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `custId` (`custId`),
  ADD KEY `orders_ibfk_2` (`productIds`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `custId` (`custId`);

--
-- Indexes for table `productfeedbacks`
--
ALTER TABLE `productfeedbacks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_customerId` (`customerId`),
  ADD KEY `fk_productId` (`productId`),
  ADD KEY `fk_vendorId` (`vendorId`),
  ADD KEY `fk_storeId` (`storeId`);

--
-- Indexes for table `productoffers`
--
ALTER TABLE `productoffers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `productId` (`productId`);

--
-- Indexes for table `productphotos`
--
ALTER TABLE `productphotos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `productId` (`productId`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_subcategoryId` (`subCategoryId`),
  ADD KEY `fk_childCategoryId` (`childCategoryId`),
  ADD KEY `fk_createdId` (`createdId`),
  ADD KEY `fk_categoryId` (`categoryId`);

--
-- Indexes for table `requeststores`
--
ALTER TABLE `requeststores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendorName` (`vendorName`);

--
-- Indexes for table `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `areaId` (`areaId`);

--
-- Indexes for table `store_areas`
--
ALTER TABLE `store_areas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `storeId` (`storeId`),
  ADD KEY `areaId` (`areaId`);

--
-- Indexes for table `store_products`
--
ALTER TABLE `store_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplierId` (`supplierId`),
  ADD KEY `productId` (`productId`);

--
-- Indexes for table `subcategories`
--
ALTER TABLE `subcategories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Indexes for table `subchildcategories`
--
ALTER TABLE `subchildcategories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoryId` (`categoryId`),
  ADD KEY `subcategoryId` (`subcategoryId`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `areaId` (`areaId`);

--
-- Indexes for table `vendorstocks`
--
ALTER TABLE `vendorstocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoryId` (`categoryId`),
  ADD KEY `vendorId` (`vendorId`);

--
-- Indexes for table `vendor_areas`
--
ALTER TABLE `vendor_areas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendorId` (`vendorId`),
  ADD KEY `areaId` (`areaId`);

--
-- Indexes for table `vendor_products`
--
ALTER TABLE `vendor_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplierId` (`supplierId`),
  ADD KEY `productId` (`productId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `ads`
--
ALTER TABLE `ads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `areas`
--
ALTER TABLE `areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `productfeedbacks`
--
ALTER TABLE `productfeedbacks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `productoffers`
--
ALTER TABLE `productoffers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `productphotos`
--
ALTER TABLE `productphotos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=261;

--
-- AUTO_INCREMENT for table `requeststores`
--
ALTER TABLE `requeststores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `store_areas`
--
ALTER TABLE `store_areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `store_products`
--
ALTER TABLE `store_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT for table `subcategories`
--
ALTER TABLE `subcategories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `subchildcategories`
--
ALTER TABLE `subchildcategories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `vendorstocks`
--
ALTER TABLE `vendorstocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `vendor_areas`
--
ALTER TABLE `vendor_areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `vendor_products`
--
ALTER TABLE `vendor_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `addresses_ibfk_2` FOREIGN KEY (`custId`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `areas`
--
ALTER TABLE `areas`
  ADD CONSTRAINT `areas_ibfk_1` FOREIGN KEY (`locationId`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`custId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`productIds`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`custId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `productfeedbacks`
--
ALTER TABLE `productfeedbacks`
  ADD CONSTRAINT `fk_customerId` FOREIGN KEY (`customerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_productId` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_storeId` FOREIGN KEY (`storeId`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_vendorId` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `productoffers`
--
ALTER TABLE `productoffers`
  ADD CONSTRAINT `productoffers_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `productphotos`
--
ALTER TABLE `productphotos`
  ADD CONSTRAINT `productphotos_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_childCategoryId` FOREIGN KEY (`childCategoryId`) REFERENCES `subchildcategories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subcategoryId` FOREIGN KEY (`subCategoryId`) REFERENCES `subcategories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `requeststores`
--
ALTER TABLE `requeststores`
  ADD CONSTRAINT `requeststores_ibfk_1` FOREIGN KEY (`vendorName`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stores`
--
ALTER TABLE `stores`
  ADD CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`areaId`) REFERENCES `areas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `store_areas`
--
ALTER TABLE `store_areas`
  ADD CONSTRAINT `store_areas_ibfk_1` FOREIGN KEY (`storeId`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `store_areas_ibfk_2` FOREIGN KEY (`areaId`) REFERENCES `areas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `store_products`
--
ALTER TABLE `store_products`
  ADD CONSTRAINT `store_products_ibfk_1` FOREIGN KEY (`supplierId`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `store_products_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `subcategories`
--
ALTER TABLE `subcategories`
  ADD CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `subchildcategories`
--
ALTER TABLE `subchildcategories`
  ADD CONSTRAINT `subchildcategories_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `subchildcategories_ibfk_2` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vendors`
--
ALTER TABLE `vendors`
  ADD CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`areaId`) REFERENCES `areas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vendorstocks`
--
ALTER TABLE `vendorstocks`
  ADD CONSTRAINT `vendorstocks_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `vendorstocks_ibfk_2` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vendor_areas`
--
ALTER TABLE `vendor_areas`
  ADD CONSTRAINT `vendor_areas_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `vendor_areas_ibfk_2` FOREIGN KEY (`areaId`) REFERENCES `areas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
