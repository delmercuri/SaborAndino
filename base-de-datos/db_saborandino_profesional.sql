-- =========================================================
-- SABOR ANDINO - BASE DE DATOS PROFESIONAL Y LIMPIA
-- Backend: saborandino-api | Frontend: Angular
-- Compatible con MariaDB 10.4+ y MySQL 8+
--
-- IMPORTANTE:
-- 1. Este archivo reemplaza la base anterior completa.
-- 2. Conserva únicamente la configuración mínima de acceso y pago.
-- 3. No incluye clientes, pedidos, reservas ni pagos de prueba.
-- 4. Todos los registros transaccionales se crearán desde la web.
-- =========================================================

DROP DATABASE IF EXISTS db_saborandino;

CREATE DATABASE db_saborandino
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_saborandino;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS vw_dashboard_summary;
DROP VIEW IF EXISTS vw_sales_report;
DROP VIEW IF EXISTS vw_reservation_summary;
DROP VIEW IF EXISTS vw_order_summary;
DROP VIEW IF EXISTS vw_client_summary;
DROP VIEW IF EXISTS vw_product_catalog;
DROP VIEW IF EXISTS vw_branch_catalog;

DROP TRIGGER IF EXISTS trg_reservation_status_insert;
DROP TRIGGER IF EXISTS trg_reservation_status_update;
DROP TRIGGER IF EXISTS trg_order_status_insert;
DROP TRIGGER IF EXISTS trg_order_status_update;
DROP TRIGGER IF EXISTS trg_table_count_insert;
DROP TRIGGER IF EXISTS trg_table_count_update;
DROP TRIGGER IF EXISTS trg_table_count_delete;

DROP TABLE IF EXISTS tpromotionitem;
DROP TABLE IF EXISTS tpromotion;
DROP TABLE IF EXISTS tpayment;
DROP TABLE IF EXISTS torderstatushistory;
DROP TABLE IF EXISTS torderdetail;
DROP TABLE IF EXISTS torder;
DROP TABLE IF EXISTS treservationstatushistory;
DROP TABLE IF EXISTS treservation;
DROP TABLE IF EXISTS tpaymentmethod;
DROP TABLE IF EXISTS trestauranttable;
DROP TABLE IF EXISTS tclient;
DROP TABLE IF EXISTS tbranchproduct;
DROP TABLE IF EXISTS tproductdietarytag;
DROP TABLE IF EXISTS tproductingredient;
DROP TABLE IF EXISTS tproduct;
DROP TABLE IF EXISTS tcategory;
DROP TABLE IF EXISTS tbranchservice;
DROP TABLE IF EXISTS tbranch;
DROP TABLE IF EXISTS tuser;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------
-- USUARIOS ADMINISTRATIVOS
-- ---------------------------------------------------------
CREATE TABLE tuser (
  idUser CHAR(36) NOT NULL,
  firstName VARCHAR(70) NOT NULL,
  surName VARCHAR(80) NOT NULL,
  displayName VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NULL,
  position VARCHAR(100) NOT NULL,
  assignedBranch VARCHAR(120) NOT NULL,
  avatarUrl LONGTEXT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  lastLoginAt DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idUser),
  UNIQUE KEY uk_tuser_email (email),
  KEY ix_tuser_status (status),
  CONSTRAINT ck_tuser_status CHECK (status IN ('ACTIVO','INACTIVO','BLOQUEADO'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- SUCURSALES
-- Conserva los campos requeridos por EntityBranch y añade
-- los datos visuales y administrativos del frontend.
-- ---------------------------------------------------------
CREATE TABLE tbranch (
  idBranch CHAR(36) NOT NULL,
  code VARCHAR(20) NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(80) NULL,
  province VARCHAR(80) NULL,
  district VARCHAR(80) NULL,
  address VARCHAR(250) NOT NULL,
  reference VARCHAR(250) NULL,
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  openingTime TIME NULL,
  closingTime TIME NULL,
  openingHours VARCHAR(150) NOT NULL,
  manager VARCHAR(120) NULL,
  tableCount INT NOT NULL DEFAULT 0,
  capacity INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVA',
  mapsUrl VARCHAR(700) NULL,
  imageUrl LONGTEXT NULL,
  description VARCHAR(700) NULL,
  deliveryTime VARCHAR(80) NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  reviews INT NOT NULL DEFAULT 0,
  isFeatured TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idBranch),
  UNIQUE KEY uk_tbranch_code (code),
  UNIQUE KEY uk_tbranch_name (name),
  KEY ix_tbranch_location (department, province, district),
  KEY ix_tbranch_status (status),
  CONSTRAINT ck_tbranch_capacity CHECK (capacity > 0),
  CONSTRAINT ck_tbranch_table_count CHECK (tableCount >= 0),
  CONSTRAINT ck_tbranch_rating CHECK (rating BETWEEN 0 AND 5),
  CONSTRAINT ck_tbranch_reviews CHECK (reviews >= 0),
  CONSTRAINT ck_tbranch_status CHECK (status IN ('ACTIVA','INACTIVA','EN_MANTENIMIENTO'))
) ENGINE=InnoDB;

CREATE TABLE tbranchservice (
  idBranchService CHAR(36) NOT NULL,
  idBranch CHAR(36) NOT NULL,
  serviceName VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idBranchService),
  UNIQUE KEY uk_branch_service (idBranch, serviceName),
  KEY ix_branchservice_branch (idBranch),
  CONSTRAINT fk_branchservice_branch
    FOREIGN KEY (idBranch) REFERENCES tbranch(idBranch)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT ck_branchservice_status CHECK (status IN ('ACTIVO','INACTIVO'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- CATEGORÍAS Y PRODUCTOS
-- ---------------------------------------------------------
CREATE TABLE tcategory (
  idCategory CHAR(36) NOT NULL,
  code VARCHAR(20) NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(250) NOT NULL,
  imageUrl LONGTEXT NULL,
  icon VARCHAR(80) NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idCategory),
  UNIQUE KEY uk_tcategory_code (code),
  UNIQUE KEY uk_tcategory_name (name),
  KEY ix_tcategory_status (status),
  CONSTRAINT ck_tcategory_sort CHECK (sortOrder >= 0),
  CONSTRAINT ck_tcategory_status CHECK (status IN ('ACTIVA','INACTIVA'))
) ENGINE=InnoDB;

CREATE TABLE tproduct (
  idProduct CHAR(36) NOT NULL,
  idCategory CHAR(36) NOT NULL,
  code VARCHAR(20) NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(300) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  previousPrice DECIMAL(10,2) NULL,
  imageUrl LONGTEXT NULL,
  preparationTime INT NOT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  reviews INT NOT NULL DEFAULT 0,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  badge VARCHAR(80) NULL,
  badgeClass VARCHAR(80) NULL,
  spicyLevel TINYINT NOT NULL DEFAULT 0,
  available TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idProduct),
  UNIQUE KEY uk_tproduct_code (code),
  UNIQUE KEY uk_tproduct_name (name),
  KEY ix_tproduct_category (idCategory),
  KEY ix_tproduct_status (status),
  KEY ix_tproduct_featured (featured),
  CONSTRAINT fk_tproduct_category
    FOREIGN KEY (idCategory) REFERENCES tcategory(idCategory)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_tproduct_price CHECK (price > 0),
  CONSTRAINT ck_tproduct_previous_price CHECK (previousPrice IS NULL OR previousPrice > 0),
  CONSTRAINT ck_tproduct_preparation_time CHECK (preparationTime > 0),
  CONSTRAINT ck_tproduct_rating CHECK (rating BETWEEN 0 AND 5),
  CONSTRAINT ck_tproduct_reviews CHECK (reviews >= 0),
  CONSTRAINT ck_tproduct_spicy CHECK (spicyLevel BETWEEN 0 AND 3),
  CONSTRAINT ck_tproduct_status CHECK (status IN ('ACTIVO','AGOTADO','INACTIVO'))
) ENGINE=InnoDB;

CREATE TABLE tproductingredient (
  idProductIngredient CHAR(36) NOT NULL,
  idProduct CHAR(36) NOT NULL,
  ingredientName VARCHAR(120) NOT NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idProductIngredient),
  UNIQUE KEY uk_product_ingredient (idProduct, ingredientName),
  KEY ix_productingredient_product (idProduct),
  CONSTRAINT fk_productingredient_product
    FOREIGN KEY (idProduct) REFERENCES tproduct(idProduct)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT ck_productingredient_sort CHECK (sortOrder >= 0)
) ENGINE=InnoDB;

CREATE TABLE tproductdietarytag (
  idProductDietaryTag CHAR(36) NOT NULL,
  idProduct CHAR(36) NOT NULL,
  tagName VARCHAR(80) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idProductDietaryTag),
  UNIQUE KEY uk_product_dietary_tag (idProduct, tagName),
  KEY ix_productdietarytag_product (idProduct),
  CONSTRAINT fk_productdietarytag_product
    FOREIGN KEY (idProduct) REFERENCES tproduct(idProduct)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tbranchproduct (
  idBranchProduct CHAR(36) NOT NULL,
  idBranch CHAR(36) NOT NULL,
  idProduct CHAR(36) NOT NULL,
  branchPrice DECIMAL(10,2) NULL,
  stock INT NOT NULL DEFAULT 0,
  available TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idBranchProduct),
  UNIQUE KEY uk_branch_product (idBranch, idProduct),
  KEY ix_branchproduct_branch (idBranch),
  KEY ix_branchproduct_product (idProduct),
  KEY ix_branchproduct_status (status),
  CONSTRAINT fk_branchproduct_branch
    FOREIGN KEY (idBranch) REFERENCES tbranch(idBranch)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_branchproduct_product
    FOREIGN KEY (idProduct) REFERENCES tproduct(idProduct)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT ck_branchproduct_price CHECK (branchPrice IS NULL OR branchPrice > 0),
  CONSTRAINT ck_branchproduct_stock CHECK (stock >= 0),
  CONSTRAINT ck_branchproduct_status CHECK (status IN ('ACTIVO','AGOTADO','INACTIVO'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------
CREATE TABLE tclient (
  idClient CHAR(36) NOT NULL,
  code VARCHAR(20) NULL,
  firstName VARCHAR(70) NOT NULL,
  surName VARCHAR(70) NOT NULL,
  documentType VARCHAR(30) NOT NULL,
  documentNumber VARCHAR(20) NOT NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20) NOT NULL,
  department VARCHAR(80) NULL,
  province VARCHAR(80) NULL,
  district VARCHAR(80) NULL,
  address VARCHAR(250) NULL,
  registrationDate DATE NOT NULL DEFAULT (CURRENT_DATE),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idClient),
  UNIQUE KEY uk_tclient_code (code),
  UNIQUE KEY uk_tclient_document (documentType, documentNumber),
  UNIQUE KEY uk_tclient_email (email),
  KEY ix_tclient_phone (phone),
  KEY ix_tclient_location (department, province, district),
  KEY ix_tclient_status (status),
  CONSTRAINT ck_tclient_status CHECK (status IN ('ACTIVO','INACTIVO','BLOQUEADO'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- MESAS
-- ---------------------------------------------------------
CREATE TABLE trestauranttable (
  idRestaurantTable CHAR(36) NOT NULL,
  idBranch CHAR(36) NOT NULL,
  tableNumber VARCHAR(30) NOT NULL,
  capacity INT NOT NULL,
  location VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idRestaurantTable),
  UNIQUE KEY uk_table_branch_number (idBranch, tableNumber),
  KEY ix_table_branch (idBranch),
  KEY ix_table_status (status),
  CONSTRAINT fk_table_branch
    FOREIGN KEY (idBranch) REFERENCES tbranch(idBranch)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_table_capacity CHECK (capacity > 0),
  CONSTRAINT ck_table_status CHECK (status IN ('DISPONIBLE','OCUPADA','RESERVADA','MANTENIMIENTO','INACTIVA'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- MÉTODOS DE PAGO
-- ---------------------------------------------------------
CREATE TABLE tpaymentmethod (
  idPaymentMethod CHAR(36) NOT NULL,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(250) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idPaymentMethod),
  UNIQUE KEY uk_paymentmethod_code (code),
  UNIQUE KEY uk_paymentmethod_name (name),
  CONSTRAINT ck_paymentmethod_status CHECK (status IN ('ACTIVO','INACTIVO'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- RESERVAS
-- ---------------------------------------------------------
CREATE TABLE treservation (
  idReservation CHAR(36) NOT NULL,
  reservationCode VARCHAR(20) NOT NULL,
  idClient CHAR(36) NOT NULL,
  idBranch CHAR(36) NOT NULL,
  idRestaurantTable CHAR(36) NOT NULL,
  reservationDate DATE NOT NULL,
  reservationTime TIME NOT NULL,
  numberOfPeople INT NOT NULL,
  occasion VARCHAR(100) NULL,
  contactPreference VARCHAR(50) NULL,
  notes VARCHAR(500) NULL,
  depositAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  paymentReference VARCHAR(100) NULL,
  acceptPrivacy TINYINT(1) NOT NULL DEFAULT 0,
  acceptConditions TINYINT(1) NOT NULL DEFAULT 0,
  cancellationReason VARCHAR(500) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idReservation),
  UNIQUE KEY uk_reservation_code (reservationCode),
  KEY ix_reservation_client (idClient),
  KEY ix_reservation_branch (idBranch),
  KEY ix_reservation_table (idRestaurantTable),
  KEY ix_reservation_datetime (reservationDate, reservationTime),
  KEY ix_reservation_status (status),
  CONSTRAINT fk_reservation_client
    FOREIGN KEY (idClient) REFERENCES tclient(idClient)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reservation_branch
    FOREIGN KEY (idBranch) REFERENCES tbranch(idBranch)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reservation_table
    FOREIGN KEY (idRestaurantTable) REFERENCES trestauranttable(idRestaurantTable)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_reservation_people CHECK (numberOfPeople > 0),
  CONSTRAINT ck_reservation_deposit CHECK (depositAmount >= 0),
  CONSTRAINT ck_reservation_status CHECK (status IN ('PENDIENTE','CONFIRMADA','REPROGRAMADA','ATENDIDA','CANCELADA'))
) ENGINE=InnoDB;

CREATE TABLE treservationstatushistory (
  idReservationStatusHistory CHAR(36) NOT NULL,
  idReservation CHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL,
  note VARCHAR(500) NULL,
  changedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idReservationStatusHistory),
  KEY ix_reservationhistory_reservation (idReservation),
  KEY ix_reservationhistory_changed (changedAt),
  CONSTRAINT fk_reservationhistory_reservation
    FOREIGN KEY (idReservation) REFERENCES treservation(idReservation)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- PEDIDOS Y DETALLES
-- ---------------------------------------------------------
CREATE TABLE torder (
  idOrder CHAR(36) NOT NULL,
  orderCode VARCHAR(20) NOT NULL,
  idClient CHAR(36) NOT NULL,
  idBranch CHAR(36) NOT NULL,
  idPaymentMethod CHAR(36) NULL,
  orderType VARCHAR(20) NOT NULL,
  deliveryAddress VARCHAR(250) NULL,
  deliveryReference VARCHAR(250) NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  deliveryCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  notes VARCHAR(500) NULL,
  cancellationReason VARCHAR(500) NULL,
  estimatedMinutes INT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
  confirmedAt DATETIME NULL,
  readyAt DATETIME NULL,
  deliveredAt DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idOrder),
  UNIQUE KEY uk_order_code (orderCode),
  KEY ix_order_client (idClient),
  KEY ix_order_branch (idBranch),
  KEY ix_order_payment_method (idPaymentMethod),
  KEY ix_order_status (status),
  KEY ix_order_created (createdAt),
  CONSTRAINT fk_order_client
    FOREIGN KEY (idClient) REFERENCES tclient(idClient)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_order_branch
    FOREIGN KEY (idBranch) REFERENCES tbranch(idBranch)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_order_payment_method
    FOREIGN KEY (idPaymentMethod) REFERENCES tpaymentmethod(idPaymentMethod)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_order_type CHECK (orderType IN ('DELIVERY','RECOJO')),
  CONSTRAINT ck_order_subtotal CHECK (subtotal >= 0),
  CONSTRAINT ck_order_delivery_cost CHECK (deliveryCost >= 0),
  CONSTRAINT ck_order_total CHECK (total >= 0),
  CONSTRAINT ck_order_estimated CHECK (estimatedMinutes IS NULL OR estimatedMinutes >= 0),
  CONSTRAINT ck_order_status CHECK (status IN ('PENDIENTE','CONFIRMADO','EN_PREPARACION','LISTO','EN_CAMINO','ENTREGADO','CANCELADO'))
) ENGINE=InnoDB;

CREATE TABLE torderdetail (
  idOrderDetail CHAR(36) NOT NULL,
  idOrder CHAR(36) NOT NULL,
  idProduct CHAR(36) NOT NULL,
  productNameSnapshot VARCHAR(120) NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idOrderDetail),
  KEY ix_orderdetail_order (idOrder),
  KEY ix_orderdetail_product (idProduct),
  CONSTRAINT fk_orderdetail_order
    FOREIGN KEY (idOrder) REFERENCES torder(idOrder)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_orderdetail_product
    FOREIGN KEY (idProduct) REFERENCES tproduct(idProduct)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_orderdetail_quantity CHECK (quantity > 0),
  CONSTRAINT ck_orderdetail_unit_price CHECK (unitPrice > 0),
  CONSTRAINT ck_orderdetail_subtotal CHECK (subtotal > 0)
) ENGINE=InnoDB;

CREATE TABLE torderstatushistory (
  idOrderStatusHistory CHAR(36) NOT NULL,
  idOrder CHAR(36) NOT NULL,
  status VARCHAR(30) NOT NULL,
  note VARCHAR(500) NULL,
  changedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idOrderStatusHistory),
  KEY ix_orderhistory_order (idOrder),
  KEY ix_orderhistory_changed (changedAt),
  CONSTRAINT fk_orderhistory_order
    FOREIGN KEY (idOrder) REFERENCES torder(idOrder)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- PAGOS Y COMPROBANTES
-- ---------------------------------------------------------
CREATE TABLE tpayment (
  idPayment CHAR(36) NOT NULL,
  idOrder CHAR(36) NULL,
  idReservation CHAR(36) NULL,
  idPaymentMethod CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reference VARCHAR(100) NULL,
  operationDate DATETIME NULL,
  notes VARCHAR(500) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idPayment),
  KEY ix_payment_order (idOrder),
  KEY ix_payment_reservation (idReservation),
  KEY ix_payment_method (idPaymentMethod),
  KEY ix_payment_status (status),
  CONSTRAINT fk_payment_order
    FOREIGN KEY (idOrder) REFERENCES torder(idOrder)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_payment_reservation
    FOREIGN KEY (idReservation) REFERENCES treservation(idReservation)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_payment_method
    FOREIGN KEY (idPaymentMethod) REFERENCES tpaymentmethod(idPaymentMethod)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_payment_amount CHECK (amount > 0),
  CONSTRAINT ck_payment_status CHECK (status IN ('PENDIENTE','APROBADO','RECHAZADO','ANULADO')),
  CONSTRAINT ck_payment_owner CHECK (
    (idOrder IS NOT NULL AND idReservation IS NULL)
    OR (idOrder IS NULL AND idReservation IS NOT NULL)
  )
) ENGINE=InnoDB;


-- ---------------------------------------------------------
-- PROMOCIONES DEL HOME
-- ---------------------------------------------------------
CREATE TABLE tpromotion (
  idPromotion CHAR(36) NOT NULL,
  idProduct CHAR(36) NOT NULL,
  code VARCHAR(20) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(700) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  previousPrice DECIMAL(10,2) NULL,
  discountLabel VARCHAR(80) NULL,
  imageUrl LONGTEXT NULL,
  startDate DATE NULL,
  endDate DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idPromotion),
  UNIQUE KEY uk_promotion_code (code),
  KEY ix_promotion_product (idProduct),
  CONSTRAINT fk_promotion_product
    FOREIGN KEY (idProduct) REFERENCES tproduct(idProduct)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_promotion_price CHECK (price > 0),
  CONSTRAINT ck_promotion_previous_price CHECK (previousPrice IS NULL OR previousPrice > 0),
  CONSTRAINT ck_promotion_status CHECK (status IN ('ACTIVA','INACTIVA','FINALIZADA'))
) ENGINE=InnoDB;

CREATE TABLE tpromotionitem (
  idPromotionItem CHAR(36) NOT NULL,
  idPromotion CHAR(36) NOT NULL,
  itemDescription VARCHAR(200) NOT NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (idPromotionItem),
  KEY ix_promotionitem_promotion (idPromotion),
  CONSTRAINT fk_promotionitem_promotion
    FOREIGN KEY (idPromotion) REFERENCES tpromotion(idPromotion)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT ck_promotionitem_sort CHECK (sortOrder >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- TRIGGERS DE CONSISTENCIA E HISTORIAL
-- ---------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_table_count_insert
AFTER INSERT ON trestauranttable
FOR EACH ROW
BEGIN
  UPDATE tbranch
  SET tableCount = (
    SELECT COUNT(*)
    FROM trestauranttable
    WHERE idBranch = NEW.idBranch
      AND status <> 'INACTIVA'
  )
  WHERE idBranch = NEW.idBranch;
END$$

CREATE TRIGGER trg_table_count_update
AFTER UPDATE ON trestauranttable
FOR EACH ROW
BEGIN
  UPDATE tbranch
  SET tableCount = (
    SELECT COUNT(*)
    FROM trestauranttable
    WHERE idBranch = OLD.idBranch
      AND status <> 'INACTIVA'
  )
  WHERE idBranch = OLD.idBranch;

  IF NEW.idBranch <> OLD.idBranch THEN
    UPDATE tbranch
    SET tableCount = (
      SELECT COUNT(*)
      FROM trestauranttable
      WHERE idBranch = NEW.idBranch
        AND status <> 'INACTIVA'
    )
    WHERE idBranch = NEW.idBranch;
  END IF;
END$$

CREATE TRIGGER trg_table_count_delete
AFTER DELETE ON trestauranttable
FOR EACH ROW
BEGIN
  UPDATE tbranch
  SET tableCount = (
    SELECT COUNT(*)
    FROM trestauranttable
    WHERE idBranch = OLD.idBranch
      AND status <> 'INACTIVA'
  )
  WHERE idBranch = OLD.idBranch;
END$$

CREATE TRIGGER trg_order_status_insert
AFTER INSERT ON torder
FOR EACH ROW
BEGIN
  INSERT INTO torderstatushistory
  (idOrderStatusHistory, idOrder, status, note, changedAt)
  VALUES
  (UUID(), NEW.idOrder, NEW.status, 'Pedido registrado.', NEW.createdAt);
END$$

CREATE TRIGGER trg_order_status_update
AFTER UPDATE ON torder
FOR EACH ROW
BEGIN
  IF NEW.status <> OLD.status THEN
    INSERT INTO torderstatushistory
    (idOrderStatusHistory, idOrder, status, note, changedAt)
    VALUES
    (
      UUID(),
      NEW.idOrder,
      NEW.status,
      CASE
        WHEN NEW.status = 'CANCELADO' THEN COALESCE(NEW.cancellationReason, 'Pedido cancelado.')
        ELSE CONCAT('Estado actualizado a ', NEW.status, '.')
      END,
      NEW.updatedAt
    );
  END IF;
END$$

CREATE TRIGGER trg_reservation_status_insert
AFTER INSERT ON treservation
FOR EACH ROW
BEGIN
  INSERT INTO treservationstatushistory
  (idReservationStatusHistory, idReservation, status, note, changedAt)
  VALUES
  (UUID(), NEW.idReservation, NEW.status, 'Reserva registrada.', NEW.createdAt);
END$$

CREATE TRIGGER trg_reservation_status_update
AFTER UPDATE ON treservation
FOR EACH ROW
BEGIN
  IF NEW.status <> OLD.status THEN
    INSERT INTO treservationstatushistory
    (idReservationStatusHistory, idReservation, status, note, changedAt)
    VALUES
    (
      UUID(),
      NEW.idReservation,
      NEW.status,
      CASE
        WHEN NEW.status = 'CANCELADA' THEN COALESCE(NEW.cancellationReason, 'Reserva cancelada.')
        ELSE CONCAT('Estado actualizado a ', NEW.status, '.')
      END,
      NEW.updatedAt
    );
  END IF;
END$$

DELIMITER ;


-- =========================================================
-- DATOS MAESTROS DE INSTALACIÓN
-- Las tablas transaccionales quedan vacías. Los clientes,
-- pedidos, reservas y pagos se crearán desde la web.
-- =========================================================

USE db_saborandino;
SET NAMES utf8mb4;
START TRANSACTION;

-- tuser
INSERT INTO tuser
(idUser, firstName, surName, displayName, phone, position, assignedBranch, avatarUrl,
 email, password, role, status, createdAt, updatedAt)
VALUES
('00000000-0000-0000-0000-000000000001', 'Administrador', 'Sabor Andino', 'Administrador Sabor Andino',
 NULL, 'Administrador general', 'Todas las sucursales', '/images/logo/logo-sabor-andino.png',
 'admin@saborandino.pe', '$2a$10$uirRFNpkzFXh56Qjb4qtpurzUcWzhyVgQmg8YVl6wsfzYypq1Q.FW', 'ADMIN', 'ACTIVO', NOW(), NOW());



-- Las tablas maestras del negocio se entregan vacías.
-- Las sucursales, categorías, productos, servicios, stock y mesas se registran
-- desde el panel administrativo para evitar datos simulados.

-- tpaymentmethod
INSERT INTO tpaymentmethod
(idPaymentMethod, code, name, description, status, createdAt, updatedAt)
VALUES
('90000000-0000-0000-0000-000000000001', 'YAPE', 'Yape', 'Pago mediante número o código QR de Yape.', 'ACTIVO', NOW(), NOW()),
('90000000-0000-0000-0000-000000000002', 'TARJETA_BCP', 'Tarjeta BCP', 'Pago con tarjeta bancaria procesada por BCP.', 'ACTIVO', NOW(), NOW()),
('90000000-0000-0000-0000-000000000003', 'EFECTIVO', 'Efectivo', 'Pago en efectivo al recoger o recibir el pedido.', 'ACTIVO', NOW(), NOW());



-- Las promociones se registran desde el panel administrativo.

COMMIT;

-- Todas las tablas de negocio se entregan sin registros simulados.
-- Solo se conserva el usuario administrador inicial y los métodos de pago del sistema.
-- Los registros se crearán desde la página pública o el panel administrativo.

-- =========================================================
-- SABOR ANDINO - VISTAS PARA FRONTEND, DASHBOARD Y REPORTES
-- Ejecutar después de los datos iniciales.
-- =========================================================

USE db_saborandino;

CREATE OR REPLACE VIEW vw_branch_catalog AS
SELECT
  b.idBranch,
  b.code,
  b.name,
  b.department,
  b.province,
  b.district,
  b.address,
  b.reference,
  b.phone,
  b.whatsapp,
  b.email,
  b.openingTime,
  b.closingTime,
  b.openingHours,
  b.capacity,
  b.tableCount,
  b.status,
  b.mapsUrl,
  b.imageUrl,
  b.description,
  b.deliveryTime,
  b.rating,
  b.reviews,
  b.isFeatured,
  GROUP_CONCAT(
    DISTINCT CASE WHEN bs.status = 'ACTIVO' THEN bs.serviceName END
    ORDER BY bs.serviceName SEPARATOR ', '
  ) AS services
FROM tbranch b
LEFT JOIN tbranchservice bs ON bs.idBranch = b.idBranch
GROUP BY
  b.idBranch, b.code, b.name, b.department, b.province, b.district,
  b.address, b.reference, b.phone, b.whatsapp, b.email,
  b.openingTime, b.closingTime, b.openingHours, b.capacity,
  b.tableCount, b.status, b.mapsUrl, b.imageUrl, b.description,
  b.deliveryTime, b.rating, b.reviews, b.isFeatured;

CREATE OR REPLACE VIEW vw_product_catalog AS
SELECT
  p.idProduct,
  p.code,
  p.name,
  p.description,
  p.price,
  p.previousPrice,
  p.imageUrl,
  p.preparationTime,
  p.rating,
  p.reviews,
  p.featured,
  p.badge,
  p.badgeClass,
  p.spicyLevel,
  p.available,
  p.status,
  c.idCategory,
  c.name AS categoryName,
  c.icon AS categoryIcon,
  GROUP_CONCAT(DISTINCT dt.tagName ORDER BY dt.tagName SEPARATOR ', ') AS dietaryTags,
  GROUP_CONCAT(DISTINCT pi.ingredientName ORDER BY pi.sortOrder SEPARATOR ', ') AS ingredients,
  (
    SELECT COALESCE(SUM(bp.stock), 0)
    FROM tbranchproduct bp
    WHERE bp.idProduct = p.idProduct
      AND bp.status = 'ACTIVO'
  ) AS totalStock
FROM tproduct p
INNER JOIN tcategory c ON c.idCategory = p.idCategory
LEFT JOIN tproductdietarytag dt ON dt.idProduct = p.idProduct
LEFT JOIN tproductingredient pi ON pi.idProduct = p.idProduct
GROUP BY
  p.idProduct, p.code, p.name, p.description, p.price, p.previousPrice,
  p.imageUrl, p.preparationTime, p.rating, p.reviews, p.featured,
  p.badge, p.badgeClass, p.spicyLevel, p.available, p.status,
  c.idCategory, c.name, c.icon;

CREATE OR REPLACE VIEW vw_client_summary AS
SELECT
  c.idClient,
  c.code,
  c.firstName,
  c.surName,
  CONCAT(c.firstName, ' ', c.surName) AS fullName,
  c.documentType,
  c.documentNumber,
  c.email,
  c.phone,
  c.department,
  c.province,
  c.district,
  c.address,
  c.registrationDate,
  c.status,
  MAX(o.createdAt) AS lastOrderDate,
  COUNT(DISTINCT o.idOrder) AS orderCount,
  COALESCE(SUM(CASE WHEN o.status <> 'CANCELADO' THEN o.total ELSE 0 END), 0.00) AS totalSpent
FROM tclient c
LEFT JOIN torder o ON o.idClient = c.idClient
GROUP BY
  c.idClient, c.code, c.firstName, c.surName, c.documentType,
  c.documentNumber, c.email, c.phone, c.department, c.province,
  c.district, c.address, c.registrationDate, c.status;

CREATE OR REPLACE VIEW vw_order_summary AS
SELECT
  o.idOrder,
  o.orderCode,
  o.orderType,
  o.deliveryAddress,
  o.deliveryReference,
  o.subtotal,
  o.deliveryCost,
  o.total,
  o.notes,
  o.cancellationReason,
  o.estimatedMinutes,
  o.status,
  o.createdAt,
  o.updatedAt,
  c.idClient,
  CONCAT(c.firstName, ' ', c.surName) AS customerName,
  c.phone AS customerPhone,
  b.idBranch,
  b.name AS branchName,
  b.department AS branchDepartment,
  pm.idPaymentMethod,
  pm.name AS paymentMethod,
  p.status AS paymentStatus,
  p.reference AS paymentReference
FROM torder o
INNER JOIN tclient c ON c.idClient = o.idClient
INNER JOIN tbranch b ON b.idBranch = o.idBranch
LEFT JOIN tpaymentmethod pm ON pm.idPaymentMethod = o.idPaymentMethod
LEFT JOIN tpayment p ON p.idOrder = o.idOrder;

CREATE OR REPLACE VIEW vw_reservation_summary AS
SELECT
  r.idReservation,
  r.reservationCode,
  r.reservationDate,
  r.reservationTime,
  r.numberOfPeople,
  r.occasion,
  r.contactPreference,
  r.notes,
  r.depositAmount,
  r.paymentReference,
  r.cancellationReason,
  r.status,
  r.createdAt,
  r.updatedAt,
  c.idClient,
  CONCAT(c.firstName, ' ', c.surName) AS customerName,
  c.phone AS customerPhone,
  b.idBranch,
  b.name AS branchName,
  b.department AS branchDepartment,
  t.idRestaurantTable,
  t.tableNumber,
  t.capacity AS tableCapacity,
  t.location AS tableLocation
FROM treservation r
INNER JOIN tclient c ON c.idClient = r.idClient
INNER JOIN tbranch b ON b.idBranch = r.idBranch
INNER JOIN trestauranttable t ON t.idRestaurantTable = r.idRestaurantTable;

CREATE OR REPLACE VIEW vw_sales_report AS
SELECT
  o.idOrder,
  o.orderCode,
  DATE(o.createdAt) AS saleDate,
  b.name AS branchName,
  b.department AS branchDepartment,
  CONCAT(c.firstName, ' ', c.surName) AS customerName,
  COALESCE(od.productNameSnapshot, pr.name) AS productName,
  ca.name AS categoryName,
  od.quantity,
  od.unitPrice,
  od.subtotal AS amount,
  pm.name AS paymentMethod,
  o.status AS orderStatus
FROM torder o
INNER JOIN torderdetail od ON od.idOrder = o.idOrder
INNER JOIN tproduct pr ON pr.idProduct = od.idProduct
INNER JOIN tcategory ca ON ca.idCategory = pr.idCategory
INNER JOIN tclient c ON c.idClient = o.idClient
INNER JOIN tbranch b ON b.idBranch = o.idBranch
LEFT JOIN tpaymentmethod pm ON pm.idPaymentMethod = o.idPaymentMethod;

CREATE OR REPLACE VIEW vw_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM torder) AS totalOrders,
  (SELECT COUNT(*) FROM torder WHERE status = 'PENDIENTE') AS pendingOrders,
  (SELECT COUNT(*) FROM torder WHERE status IN ('CONFIRMADO','EN_PREPARACION','LISTO','EN_CAMINO')) AS inProcessOrders,
  (SELECT COUNT(*) FROM torder WHERE status = 'ENTREGADO') AS deliveredOrders,
  (SELECT COUNT(*) FROM treservation) AS totalReservations,
  (SELECT COUNT(*) FROM treservation WHERE status = 'PENDIENTE') AS pendingReservations,
  (SELECT COUNT(*) FROM tclient WHERE status = 'ACTIVO') AS activeClients,
  (SELECT COUNT(*) FROM tbranch WHERE status = 'ACTIVA') AS activeBranches,
  (SELECT COUNT(*) FROM tproduct WHERE status = 'ACTIVO') AS activeProducts,
  (SELECT COALESCE(SUM(total),0.00) FROM torder WHERE status <> 'CANCELADO') AS grossSales;


-- =========================================================
-- VERIFICACIÓN DE INSTALACIÓN LIMPIA
-- =========================================================
USE db_saborandino;

SELECT 'Usuarios administrativos' AS entidad, COUNT(*) AS total FROM tuser
UNION ALL SELECT 'Sucursales', COUNT(*) FROM tbranch
UNION ALL SELECT 'Categorías', COUNT(*) FROM tcategory
UNION ALL SELECT 'Productos', COUNT(*) FROM tproduct
UNION ALL SELECT 'Mesas', COUNT(*) FROM trestauranttable
UNION ALL SELECT 'Métodos de pago', COUNT(*) FROM tpaymentmethod
UNION ALL SELECT 'Clientes (debe iniciar en 0)', COUNT(*) FROM tclient
UNION ALL SELECT 'Reservas (debe iniciar en 0)', COUNT(*) FROM treservation
UNION ALL SELECT 'Pedidos (debe iniciar en 0)', COUNT(*) FROM torder
UNION ALL SELECT 'Pagos (debe iniciar en 0)', COUNT(*) FROM tpayment;

SELECT * FROM vw_dashboard_summary;
