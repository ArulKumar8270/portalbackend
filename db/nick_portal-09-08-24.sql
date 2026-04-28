-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 09, 2024 at 07:54 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nick_portal`
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

--
-- Dumping data for table `addresses`
--

INSERT INTO `addresses` (`id`, `fullname`, `phone`, `orderId`, `custId`, `discrict`, `city`, `states`, `area`, `shipping`, `createdAt`, `updatedAt`) VALUES
(2, 'arul', '8270564998', NULL, 1, 'chennai', 'channi', 'channai', 't anger', 'yes', '2024-07-22 00:10:24', '2024-07-22 00:10:24'),
(3, 'arul', '8270564998', NULL, 1, 'chennai', 'channi', 'channai', 't anger', 'yes', '2024-07-22 00:10:27', '2024-07-22 00:10:27');

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
(1, 'Channai', 1, 600017, 1, '2024-07-07 16:01:46', '2024-07-07 16:01:46'),
(2, 'Channai', 1, 600017, 1, '2024-07-07 16:01:49', '2024-07-07 16:01:49');

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `orderId` int(11) NOT NULL,
  `addressId` int(11) NOT NULL,
  `price` int(11) DEFAULT NULL,
  `total` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `createdAt`, `updatedAt`) VALUES
(1, 'testcat', '1', '2024-07-02 18:21:40', '2024-07-02 18:21:40'),
(2, 'Prithi345v', 'Test', '2024-07-26 13:52:10', '2024-07-26 13:52:10'),
(3, 'Prithi345v234543', 'Test', '2024-07-26 14:23:35', '2024-07-26 14:23:35');

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

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `firstName`, `lastName`, `phone`, `email`, `password`, `userid`, `gender`, `createdAt`, `updatedAt`) VALUES
(1, 'arul', 'kumar', '8270564998', 'arulkumar@gmail.com', 'arulkumar@gmail.com', 'arulkumar@gmail.com', 'male', '2024-07-22 00:06:42', '2024-07-22 00:06:42'),
(2, 'arul', 'kumar', '8270564998', 'arulkumar@gmail.com', 'arulkumar@gmail.com', 'arulkumar@gmail.com', 'male', '2024-07-22 00:06:47', '2024-07-22 00:06:47');

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
(1, 'Chennai', 1, 600017, '2024-07-07 16:01:09', '2024-07-07 16:01:09'),
(2, 'Chennai', 1, 600017, '2024-07-07 16:01:12', '2024-07-07 16:01:12');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `custId` int(11) NOT NULL,
  `number` varchar(255) DEFAULT NULL,
  `paymentmethod` varchar(255) DEFAULT NULL,
  `deliverydate` datetime DEFAULT NULL,
  `grandtotal` int(11) DEFAULT NULL,
  `status` enum('processing','shipping','delivered','cancelled') DEFAULT 'processing',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `custId`, `number`, `paymentmethod`, `deliverydate`, `grandtotal`, `status`, `createdAt`, `updatedAt`) VALUES
(2, 1, '8270564998', '1', '2024-07-24 00:10:36', 2, 'processing', '2024-07-22 00:10:59', '2024-07-22 00:10:59'),
(3, 1, '8270564998', '1', '2024-07-24 00:10:36', 2, 'processing', '2024-07-22 00:11:02', '2024-07-22 00:11:02');

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
  `categoryId` int(11) NOT NULL,
  `subCategoryId` int(11) NOT NULL,
  `childCategoryId` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `unitSize` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `buyerPrice` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `qty` int(11) DEFAULT NULL,
  `discountPer` int(11) DEFAULT NULL,
  `discount` int(11) DEFAULT NULL,
  `total` int(11) DEFAULT NULL,
  `netPrice` int(11) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `sortDesc` text DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `paymentMode` varchar(255) DEFAULT '1,2,3',
  `preOrder` varchar(255) DEFAULT NULL,
  `onlinePayment` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `categoryId`, `subCategoryId`, `childCategoryId`, `name`, `slug`, `brand`, `unitSize`, `status`, `buyerPrice`, `price`, `qty`, `discountPer`, `discount`, `total`, `netPrice`, `photo`, `sortDesc`, `desc`, `createdAt`, `updatedAt`, `paymentMode`, `preOrder`, `onlinePayment`) VALUES
(5, 1, 1, 1, 'test', '1', 'test', '4', 'inactive', 5, 5, 3, 7, 2, 7, 7, '', 'test', 'test', '2024-07-02 18:24:02', '2024-07-02 18:24:02', '1,2,3', NULL, NULL),
(6, 1, 1, 1, 'fasdfasdfa', '1', NULL, NULL, 'active', NULL, 2345, 234523, 234523, 5234, 2147483647, NULL, '', '452345', NULL, '2024-07-02 18:28:54', '2024-07-02 18:28:54', '1,2,3', NULL, NULL),
(7, 1, 1, 1, 'fasdfasdfa', '2', NULL, NULL, 'active', NULL, 2345, 234523, 234523, 5234, 2147483647, NULL, '', '452345', NULL, '2024-07-02 18:33:42', '2024-07-02 18:33:42', '1,2,3', NULL, NULL),
(8, 1, 1, 1, 'fasdfasdfa', '3', NULL, NULL, 'active', NULL, 2345, 234523, 234523, 5234, 2147483647, NULL, '', '452345', NULL, '2024-07-02 18:34:19', '2024-07-02 18:34:19', '1,2,3', NULL, NULL),
(9, 1, 1, 1, 'fasdfasdfa', '3', NULL, NULL, 'active', NULL, 2345, 234523, 234523, 5234, 2147483647, NULL, '', '452345', NULL, '2024-07-02 18:34:19', '2024-07-02 18:34:19', '1,2,3', NULL, NULL),
(10, 1, 1, 1, 'test', '5', 'test', '4', 'inactive', 5, 5, 3, 7, 2, 7, 7, '', 'test', 'test', '2024-07-02 19:04:03', '2024-07-02 19:04:03', '1,2,3', NULL, NULL),
(11, 1, 1, 1, 'test', '6', 'test', '4', 'inactive', 5, 5, 3, 7, 2, 7, 7, '', 'test', 'test', '2024-07-02 19:04:41', '2024-07-02 19:04:41', '1,2,3', NULL, NULL),
(12, 1, 1, 1, 'test', '7', 'test', '4', 'inactive', 5, 5, 3, 7, 2, 7, 7, 'uploads\\photo_1719947140303.jpg', 'test', 'test', '2024-07-02 19:05:40', '2024-07-02 19:05:40', '1,2,3', NULL, NULL),
(14, 1, 2, 2, 'rqewrq', '3', NULL, NULL, 'active', NULL, 234, 234, 234, 234, 234, NULL, 'uploads\\photo_1722004136353.jpg', '23423', NULL, '2024-07-26 14:28:56', '2024-07-26 14:28:56', '1,2,3', NULL, NULL),
(19, 2, 2, 2, 'Test@1231243', '3', NULL, NULL, 'active', NULL, 1000, 1, 800, 1, 800, NULL, 'uploads\\photo_1722865469866.png', 'sdfas', NULL, '2024-08-05 13:44:29', '2024-08-05 13:44:29', '1,2,3', NULL, NULL),
(20, 2, 2, 2, 'Test@1231243', '3', NULL, NULL, 'active', NULL, 1000, 1, 800, 1, 800, NULL, 'uploads\\photo_1722865530492.png', 'sdfas', NULL, '2024-08-05 13:45:30', '2024-08-05 13:45:30', '1,2,3', NULL, NULL),
(21, 2, 2, 2, 'Test@1231243', '3', NULL, NULL, 'active', NULL, 1000, 1, 800, 1, 800, NULL, 'uploads\\photo_1722865579148.png', 'sdfas', NULL, '2024-08-05 13:46:19', '2024-08-05 13:46:19', '1,2,3', NULL, NULL),
(22, 2, 2, 2, 'Test@1231243', '3', NULL, NULL, 'active', NULL, 1000, 1, 800, 1, 800, NULL, 'uploads\\photo_1722865665287.png', 'sdfas', NULL, '2024-08-05 13:47:45', '2024-08-05 13:47:45', '1,2,3', NULL, NULL),
(23, 2, 2, 2, 'Test@1231243', '3', NULL, NULL, 'active', NULL, 1000, 1, 800, 1, 800, NULL, 'uploads\\photo_1722866320651.png', 'sdfas', NULL, '2024-08-05 13:58:40', '2024-08-05 13:58:40', '1,2,3', NULL, NULL),
(24, 2, 2, 2, 'Test@1231243', '3', NULL, NULL, 'active', NULL, 1000, 1, 800, 1, 800, NULL, 'uploads\\photo_1722866350986.png', 'sdfas', NULL, '2024-08-05 13:59:10', '2024-08-05 13:59:10', '1,2,3', NULL, NULL),
(25, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866429865.png', '234', NULL, '2024-08-05 14:00:29', '2024-08-05 14:00:29', '1,2,3', NULL, NULL),
(26, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866510528.png', '234', NULL, '2024-08-05 14:01:50', '2024-08-05 14:01:50', '1,2,3', NULL, NULL),
(27, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866515773.png', '234', NULL, '2024-08-05 14:01:55', '2024-08-05 14:01:55', '1,2,3', NULL, NULL),
(28, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866666794.png', '234', NULL, '2024-08-05 14:04:26', '2024-08-05 14:04:26', '1,2,3', NULL, NULL),
(29, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866694871.png', '234', NULL, '2024-08-05 14:04:54', '2024-08-05 14:04:54', '1,2,3', NULL, NULL),
(30, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866729059.png', '234', NULL, '2024-08-05 14:05:29', '2024-08-05 14:05:29', '1,2,3', NULL, NULL),
(31, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866741121.png', '234', NULL, '2024-08-05 14:05:41', '2024-08-05 14:05:41', '1,2,3', NULL, NULL),
(32, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866742091.png', '234', NULL, '2024-08-05 14:05:42', '2024-08-05 14:05:42', '1,2,3', NULL, NULL),
(33, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866742540.png', '234', NULL, '2024-08-05 14:05:42', '2024-08-05 14:05:42', '1,2,3', NULL, NULL),
(34, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866742960.png', '234', NULL, '2024-08-05 14:05:42', '2024-08-05 14:05:42', '1,2,3', NULL, NULL),
(35, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866743368.png', '234', NULL, '2024-08-05 14:05:43', '2024-08-05 14:05:43', '1,2,3', NULL, NULL),
(36, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866749363.png', '234', NULL, '2024-08-05 14:05:49', '2024-08-05 14:05:49', '1,2,3', NULL, NULL),
(37, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866796539.png', '234', NULL, '2024-08-05 14:06:36', '2024-08-05 14:06:36', '1,2,3', NULL, NULL),
(38, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866833321.png', '234', NULL, '2024-08-05 14:07:13', '2024-08-05 14:07:13', '1,2,3', NULL, NULL),
(39, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866849764.png', '234', NULL, '2024-08-05 14:07:29', '2024-08-05 14:07:29', '1,2,3', NULL, NULL),
(40, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866954445.png', '234', NULL, '2024-08-05 14:09:14', '2024-08-05 14:09:14', '1,2,3', NULL, NULL),
(41, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722866985721.png', '234', NULL, '2024-08-05 14:09:45', '2024-08-05 14:09:45', '1,2,3', NULL, NULL),
(42, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722867013026.png', '234', NULL, '2024-08-05 14:10:13', '2024-08-05 14:10:13', '1,2,3', NULL, NULL),
(43, 2, 2, 2, 'Tal;sdf', '1', NULL, NULL, 'active', NULL, 234, 45234, 234, 234, 2345, NULL, 'uploads\\photo_1722867073074.png', '234', NULL, '2024-08-05 14:11:13', '2024-08-05 14:11:13', '1,2,3', NULL, NULL),
(44, 2, 2, 2, 'asdfsd', '1', NULL, NULL, 'active', NULL, 234, 1, 1, 11, 112, NULL, 'uploads\\photo_1722867241742.png', 'asdf342', NULL, '2024-08-05 14:14:01', '2024-08-05 14:14:01', '1,2,3', NULL, NULL),
(45, 1, 2, 2, 'asfda', '1', NULL, NULL, 'active', NULL, 22, 23, 23, 23, 232, NULL, 'uploads\\photo_1722867388377.png', 'asdf', NULL, '2024-08-05 14:16:28', '2024-08-05 14:16:28', '1,2,3', NULL, NULL),
(46, 2, 2, 2, '8769', '1', NULL, NULL, 'active', NULL, 78, 78, 78, 798, 78, NULL, 'uploads\\photo_1722867488946.png', '978', NULL, '2024-08-05 14:18:08', '2024-08-05 14:18:08', '1,2,3', NULL, NULL),
(47, 2, 2, 2, '8769', '1', NULL, NULL, 'active', NULL, 78, 78, 78, 798, 78, NULL, 'uploads\\photo_1722867641876.png', '978', NULL, '2024-08-05 14:20:41', '2024-08-05 14:20:41', '1,2,3', NULL, NULL),
(48, 1, 2, 2, 'dsdfsdfg', '1', NULL, NULL, 'active', NULL, 234, 2345, 234, 22, 23, NULL, 'uploads\\photo_1722874714646.png', '3245', NULL, '2024-08-05 16:18:34', '2024-08-05 16:18:34', '1,2,3', NULL, NULL),
(49, 2, 2, 2, 'lsajd', '1', NULL, NULL, 'active', NULL, 23, 23, 23, 2323, 323, NULL, 'uploads\\photo_1722875086109.png', 'asdf', NULL, '2024-08-05 16:24:46', '2024-08-05 16:24:46', '1,2,3', NULL, NULL),
(50, 1, 2, 2, 'fasdf', '1', NULL, NULL, 'active', NULL, 0, 0, 34, 43, 34, NULL, 'uploads\\photo_1722960525999.png', 'asd', NULL, '2024-08-06 16:08:46', '2024-08-06 16:08:46', '1,3', NULL, NULL);

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

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
('20240806153356-add-column-to-product.js');

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
  `storeImage` varchar(255) DEFAULT NULL,
  `openTime` varchar(255) DEFAULT NULL,
  `closeTime` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stores`
--

INSERT INTO `stores` (`id`, `storename`, `status`, `storeaddress`, `storedesc`, `ownername`, `owneraddress`, `email`, `password`, `phone`, `areaId`, `accountNo`, `accountHolderName`, `bankName`, `IFSC`, `branch`, `adharCardNo`, `panCardNo`, `GSTNo`, `createdAt`, `updatedAt`, `website`, `storeImage`, `openTime`, `closeTime`) VALUES
(7, 'Example Store', 1, '123 Example Street, Example City', 'A brief description of the store.', 'John Doe', '456 Owner Avenue, Example City', 'johndoe@example.com', 'securepassword123', '123-456-7890', 1, '1234567890', 'John Doe', 'Example Bank', 'EXMP0001234', 'Example Branch', 2147483647, 'ABCDE1234F', '12ABCDE3456F1Z2', '2024-07-21 14:18:28', '2024-07-21 14:18:28', NULL, NULL, NULL, NULL),
(8, 'dfasd', 1, 'asdfasd', 'asdf', 'asdfa', '97', '216@123.com', '216@123.com', '87097896786', 1, '876876', '876876', '876876', '86876', '876876', 6876876, '876876', '8786876', '2024-07-26 14:39:01', '2024-07-26 14:39:01', 'jkhkj', '', 'kjhkj', 'kjhkj');

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

--
-- Dumping data for table `store_areas`
--

INSERT INTO `store_areas` (`id`, `storeId`, `areaId`, `createdAt`, `updatedAt`) VALUES
(2, 7, 1, '2024-07-21 14:18:28', '2024-07-21 14:18:28'),
(3, 8, 1, '2024-07-26 14:39:01', '2024-07-26 14:39:01');

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
(1, 7, 7, 979868, 890, '2024-07-21 15:21:26', '2024-07-21 15:21:26'),
(3, 7, 48, 23, 2345, '2024-08-05 16:18:34', '2024-08-05 16:18:34');

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
(1, 'test', 1, '2024-07-02 23:53:14', '2024-07-02 23:53:14'),
(2, 'test', 1, '2024-07-02 23:53:18', '2024-07-02 23:53:18');

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
(1, 'testchi', 1, 1, '2024-07-02 23:53:54', '2024-07-02 23:53:54'),
(2, 'testchi', 1, 1, '2024-07-02 23:53:57', '2024-07-02 23:53:57');

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
(1, 'Arul', 'kumar', 'Chennai', 'arulkumar8270@gmail.com', '8270564998', '1', 1, '$2a$10$P9/GvTBtlRdKZQ4QeOPVSe97xZfVhh89cvtm1507JOhgNMrusNYSe', '2024-07-02 18:04:55', '2024-07-02 18:04:55', '7', '', '2'),
(2, 'fdasdf', NULL, NULL, 'sdfas', '345324', '0', 1, '$2a$10$bkP3dpR0dxAKl0IGaX7aGuiIray92hAl0phLatS6u6cs0ZfOSClAW', '2024-08-04 13:43:45', '2024-08-04 13:43:45', '', '', ''),
(3, 'fahskjd973', NULL, NULL, '3245@sd', '542345', '3', 1, '$2a$10$Zqm5lSzKzilrdFmv0pxrc.5by4QALagH2fI1cxuTpWM.stYPZGq6a', '2024-08-04 13:47:08', '2024-08-04 13:47:08', '', '', ''),
(4, 'fahskjd973', NULL, NULL, '32345345@sd.asdf', '542345', '3', 1, '$2a$10$kMoQuGsPMsTmso821sUKuOtNGm4ex7Yes5bisiLhqlZ5d4lpyGtAu', '2024-08-04 13:51:24', '2024-08-04 13:51:24', '', '', ''),
(5, 'dfasd', NULL, NULL, 'asdf', '3452', '0', 1, '$2a$10$2L/x1OaGYulsXbsFUBK8yuHI5ERx1iLg22gu8wp1XzYD1v78dRUw2', '2024-08-04 13:52:40', '2024-08-04 13:52:40', '', '', '');

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
(6, 'Nickname Infotech', 0, '22, Pallavan St, Ambal Nagar, Ekkatuthangal, Chennai, Tamil Nadu 600032', 'One of the best Web Design and Development Company in Chennai · Lets Get Started Your Project. We\'ll help to achieve your goals and to grow business.', 'fasdf', 'undefined', 'fwe@sdfaswdf.asdf', 'asdfa', '34523452345', 1, 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 0, 'undefined', 'undefined', '2024-08-04 09:59:02', '2024-08-04 12:29:48', '34523', '345234', 'uploads\\vendorImage_1722768953267.png', '32534', '2345234', NULL, NULL),
(7, 'asupdfo', 0, 'undefined', 'undefined', 'asdfaf', 'undefined', 'fasd@sadfw.asdf', 'sadfasd', '345234532', 1, 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 0, 'undefined', 'undefined', '2024-08-04 10:20:05', '2024-08-04 10:56:16', NULL, NULL, 'uploads\\vendorImage_1722768976728.png', NULL, NULL, NULL, NULL),
(8, 'asdfasd', 0, 'undefined', 'undefined', 'sdfasdfasdfasdasd', 'undefined', 'arul123@gmail.com', 'arul123@gmail.com', '3452342345234', 1, 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 0, 'undefined', 'undefined', '2024-08-04 10:29:26', '2024-08-04 10:56:35', NULL, NULL, 'uploads\\vendorImage_1722768995145.png', NULL, NULL, NULL, NULL),
(9, 'afsdfasd', 0, 'sddaf', 'asdf', 'sdfasdfas', 'asdfasdf', 'arul123@gmail.com', 'arul123@gmail.com', '3562345234', 1, 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 0, 'undefined', 'undefined', '2024-08-04 10:32:21', '2024-08-04 10:56:56', NULL, NULL, 'uploads\\vendorImage_1722769016538.png', NULL, NULL, NULL, NULL),
(10, 'kldfhajsd', 0, 'ahklsdf', 'asdlkjfhaSDF', 'FASDF', 'undefined', 'undefined', 'undefined', 'undefined', 1, 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 0, 'undefined', 'undefined', '2024-08-04 10:43:52', '2024-08-04 11:04:57', NULL, NULL, 'uploads\\vendorImage_1722769497919.jpg', NULL, NULL, NULL, NULL);

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

--
-- Dumping data for table `vendorstocks`
--

INSERT INTO `vendorstocks` (`id`, `categoryId`, `vendorId`, `stock`, `createdAt`, `updatedAt`) VALUES
(12, 1, 7, 34524, '2024-08-04 12:39:37', '2024-08-04 12:39:37');

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
(1, 6, 1, '2024-08-04 09:59:02', '2024-08-04 09:59:02'),
(2, 7, 1, '2024-08-04 10:20:05', '2024-08-04 10:20:05'),
(3, 8, 1, '2024-08-04 10:29:26', '2024-08-04 10:29:26'),
(4, 9, 1, '2024-08-04 10:32:21', '2024-08-04 10:32:21'),
(5, 10, 1, '2024-08-04 10:43:52', '2024-08-04 10:43:52');

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
(1, 7, 49, 323, 23, '2024-08-05 16:24:46', '2024-08-05 16:24:46'),
(2, 7, 40, 323, 23, '2024-08-05 16:24:46', '2024-08-05 16:24:46'),
(3, 7, 50, 34, 0, '2024-08-06 16:08:46', '2024-08-06 16:08:46');

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
  ADD KEY `orderId` (`orderId`),
  ADD KEY `addressId` (`addressId`);

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
  ADD KEY `custId` (`custId`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `custId` (`custId`);

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
  ADD KEY `categoryId` (`categoryId`),
  ADD KEY `subCategoryId` (`subCategoryId`),
  ADD KEY `childCategoryId` (`childCategoryId`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `areas`
--
ALTER TABLE `areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `requeststores`
--
ALTER TABLE `requeststores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `store_areas`
--
ALTER TABLE `store_areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `store_products`
--
ALTER TABLE `store_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `subcategories`
--
ALTER TABLE `subcategories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subchildcategories`
--
ALTER TABLE `subchildcategories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `vendorstocks`
--
ALTER TABLE `vendorstocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `vendor_areas`
--
ALTER TABLE `vendor_areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `vendor_products`
--
ALTER TABLE `vendor_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `carts_ibfk_2` FOREIGN KEY (`addressId`) REFERENCES `addresses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`custId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`custId`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`subCategoryId`) REFERENCES `subcategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_3` FOREIGN KEY (`childCategoryId`) REFERENCES `subchildcategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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

--
-- Constraints for table `vendor_products`
--
ALTER TABLE `vendor_products`
  ADD CONSTRAINT `vendor_products_ibfk_1` FOREIGN KEY (`supplierId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `vendor_products_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
