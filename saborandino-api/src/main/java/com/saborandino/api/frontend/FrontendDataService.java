package com.saborandino.api.frontend;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FrontendDataService {

    private static final DateTimeFormatter DATE_TIME_DB = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_TIME_UI = DateTimeFormatter.ofPattern("dd/MM/yyyy - hh:mm a", new Locale("es", "PE"));
    private static final DateTimeFormatter TIME_UI = DateTimeFormatter.ofPattern("hh:mm a", new Locale("es", "PE"));

    private final JdbcTemplate jdbc;

    public FrontendDataService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> health() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("status", "UP");
        data.put("database", "db_saborandino");
        data.put("users", jdbc.queryForObject("SELECT COUNT(*) FROM tuser", Integer.class));
        data.put("branches", jdbc.queryForObject("SELECT COUNT(*) FROM tbranch", Integer.class));
        data.put("products", jdbc.queryForObject("SELECT COUNT(*) FROM tproduct", Integer.class));
        return data;
    }

    // ---------------------------------------------------------------------
    // SUCURSALES
    // ---------------------------------------------------------------------

    public List<Map<String, Object>> getBranches(boolean onlyActive) {
        String sql = """
            SELECT idBranch, code, name, department, province, district, address,
                   COALESCE(reference, '') reference, phone, COALESCE(whatsapp, '') whatsapp, COALESCE(email, '') email,
                   TIME_FORMAT(openingTime, '%H:%i') openingTime,
                   TIME_FORMAT(closingTime, '%H:%i') closingTime,
                   COALESCE(manager, '') manager, tableCount, capacity, status,
                   COALESCE(mapsUrl, '') mapsUrl, COALESCE(imageUrl, '') imageUrl,
                   COALESCE(description, '') description, COALESCE(deliveryTime, '') deliveryTime,
                   rating, reviews, isFeatured
              FROM tbranch
             """ + (onlyActive ? " WHERE status = 'ACTIVA' " : "") + " ORDER BY name";

        List<Map<String, Object>> rows = jdbc.queryForList(sql);
        List<Map<String, Object>> result = new ArrayList<>();
        int fallbackId = 1;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            String code = string(row.get("code"));
            item.put("id", numericCode(code, fallbackId++));
            item.put("idBranch", string(row.get("idBranch")));
            item.put("code", code);
            item.put("name", string(row.get("name")));
            item.put("department", string(row.get("department")));
            item.put("province", string(row.get("province")));
            item.put("district", string(row.get("district")));
            item.put("location", joinNonBlank(string(row.get("district")), string(row.get("department"))));
            item.put("address", string(row.get("address")));
            item.put("reference", string(row.get("reference")));
            item.put("phone", string(row.get("phone")));
            item.put("whatsapp", string(row.get("whatsapp")));
            item.put("email", string(row.get("email")));
            item.put("openingTime", string(row.get("openingTime")));
            item.put("closingTime", string(row.get("closingTime")));
            item.put("openingHours", openingHours(string(row.get("openingTime")), string(row.get("closingTime"))));
            item.put("manager", string(row.get("manager")));
            item.put("tableCount", integer(row.get("tableCount")));
            item.put("capacity", integer(row.get("capacity")));
            item.put("status", branchStatusUi(string(row.get("status"))));
            item.put("mapsUrl", string(row.get("mapsUrl")));
            item.put("imageUrl", string(row.get("imageUrl")));
            item.put("description", string(row.get("description")));
            item.put("deliveryTime", string(row.get("deliveryTime")));
            item.put("rating", decimal(row.get("rating")).doubleValue());
            item.put("reviews", integer(row.get("reviews")));
            item.put("isFeatured", bool(row.get("isFeatured")));
            item.put("services", jdbc.queryForList(
                "SELECT serviceName FROM tbranchservice WHERE idBranch=? AND status='ACTIVO' ORDER BY serviceName",
                String.class, string(row.get("idBranch"))));
            result.add(item);
        }
        return result;
    }

    @Transactional
    public void syncBranches(List<Map<String, Object>> items) {
        int sequence = nextSequence("tbranch", "code");
        for (Map<String, Object> item : safeList(items)) {
            String name = trim(item.get("name"));
            String address = trim(item.get("address"));
            String phone = digits(trim(item.get("phone")));
            if (name.isBlank()) throw new IllegalArgumentException("El nombre de la sucursal es obligatorio.");
            if (address.isBlank()) throw new IllegalArgumentException("La dirección de la sucursal es obligatoria.");
            if (phone.length() != 9) throw new IllegalArgumentException("El teléfono de la sucursal debe tener 9 dígitos.");
            String code = trim(item.get("code"));
            if (code.isBlank()) code = "SUC-" + String.format("%03d", sequence++);
            String id = findId("SELECT idBranch FROM tbranch WHERE code = ?", code);
            if (id == null) id = UUID.randomUUID().toString();
            String opening = trim(item.get("openingTime"));
            String closing = trim(item.get("closingTime"));
            String hours = openingHours(opening, closing);
            String status = branchStatusDb(trim(item.get("status")));

            int updated = jdbc.update("""
                UPDATE tbranch SET name=?, department=?, province=?, district=?, address=?, reference=?,
                       phone=?, email=?, openingTime=?, closingTime=?, openingHours=?, manager=?,
                       tableCount=?, capacity=?, status=?, mapsUrl=?, imageUrl=?, updatedAt=NOW()
                 WHERE idBranch=?
                """,
                name, nullable(item.get("department")), nullable(item.get("province")),
                nullable(item.get("district")), address, nullable(item.get("reference")),
                phone, nullable(item.get("email")), sqlTime(opening), sqlTime(closing), hours,
                nullable(item.get("manager")), integer(item.get("tableCount")), Math.max(1, integer(item.get("capacity"))),
                status, nullable(item.get("mapsUrl")), nullable(item.get("imageUrl")), id);

            if (updated == 0) {
                jdbc.update("""
                    INSERT INTO tbranch
                    (idBranch, code, name, department, province, district, address, reference, phone, email,
                     openingTime, closingTime, openingHours, manager, tableCount, capacity, status, mapsUrl,
                     imageUrl, rating, reviews, isFeatured, createdAt, updatedAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())
                    """, id, code, name, nullable(item.get("department")), nullable(item.get("province")),
                    nullable(item.get("district")), address, nullable(item.get("reference")),
                    phone, nullable(item.get("email")), sqlTime(opening),
                    sqlTime(closing), hours, nullable(item.get("manager")), integer(item.get("tableCount")),
                    Math.max(1, integer(item.get("capacity"))), status, nullable(item.get("mapsUrl")),
                    nullable(item.get("imageUrl")), BigDecimal.ZERO, 0, false);
            }
        }
    }

    @Transactional
    public boolean deleteBranch(String code) {
        try {
            return jdbc.update("DELETE FROM tbranch WHERE code = ?", code) > 0;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    // ---------------------------------------------------------------------
    // CATEGORÍAS
    // ---------------------------------------------------------------------

    public List<Map<String, Object>> getCategories(boolean onlyActive) {
        String sql = """
            SELECT c.idCategory, c.code, c.name, c.description, COALESCE(c.imageUrl,'') imageUrl,
                   COALESCE(c.icon,'category') icon, c.sortOrder, c.status,
                   COUNT(p.idProduct) productCount
              FROM tcategory c
              LEFT JOIN tproduct p ON p.idCategory=c.idCategory AND p.status <> 'INACTIVO'
             """ + (onlyActive ? " WHERE c.status='ACTIVA' " : "") + """
             GROUP BY c.idCategory, c.code, c.name, c.description, c.imageUrl, c.icon, c.sortOrder, c.status
             ORDER BY c.sortOrder, c.name
            """;
        List<Map<String, Object>> rows = jdbc.queryForList(sql);
        List<Map<String, Object>> result = new ArrayList<>();
        int fallbackId = 1;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            String code = string(row.get("code"));
            item.put("id", numericCode(code, fallbackId++));
            item.put("idCategory", string(row.get("idCategory")));
            item.put("code", code);
            item.put("name", string(row.get("name")));
            item.put("description", string(row.get("description")));
            item.put("productCount", integer(row.get("productCount")));
            item.put("status", "ACTIVA".equals(string(row.get("status"))) ? "Activa" : "Inactiva");
            item.put("imageUrl", string(row.get("imageUrl")));
            item.put("icon", string(row.get("icon")));
            item.put("sortOrder", integer(row.get("sortOrder")));
            result.add(item);
        }
        return result;
    }

    @Transactional
    public void syncCategories(List<Map<String, Object>> items) {
        int sequence = nextSequence("tcategory", "code");
        int sort = 1;
        for (Map<String, Object> item : safeList(items)) {
            String name = trim(item.get("name"));
            if (name.isBlank()) throw new IllegalArgumentException("El nombre de la categoría es obligatorio.");
            String code = trim(item.get("code"));
            if (code.isBlank()) code = "CAT-" + String.format("%03d", sequence++);
            String id = findId("SELECT idCategory FROM tcategory WHERE code=?", code);
            if (id == null) id = UUID.randomUUID().toString();
            String status = "Inactiva".equalsIgnoreCase(trim(item.get("status"))) ? "INACTIVA" : "ACTIVA";
            int updated = jdbc.update("""
                UPDATE tcategory SET name=?, description=?, imageUrl=?, status=?, sortOrder=?, updatedAt=NOW()
                 WHERE idCategory=?
                """, name, defaultIfBlank(trim(item.get("description")), name),
                nullable(item.get("imageUrl")), status, sort++, id);
            if (updated == 0) {
                jdbc.update("""
                    INSERT INTO tcategory
                    (idCategory, code, name, description, imageUrl, icon, sortOrder, status, createdAt, updatedAt)
                    VALUES (?,?,?,?,?,'category',?,?,NOW(),NOW())
                    """, id, code, name,
                    defaultIfBlank(trim(item.get("description")), name), nullable(item.get("imageUrl")),
                    sort - 1, status);
            }
        }
    }

    @Transactional
    public boolean deleteCategory(String code) {
        try {
            return jdbc.update("DELETE FROM tcategory WHERE code=?", code) > 0;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    // ---------------------------------------------------------------------
    // PRODUCTOS
    // ---------------------------------------------------------------------

    public List<Map<String, Object>> getProducts(boolean onlyPublic) {
        String sql = """
            SELECT p.idProduct, p.code, p.name, p.description, c.name category,
                   p.price, p.previousPrice, COALESCE(p.imageUrl,'') imageUrl,
                   p.preparationTime, p.rating, p.reviews, p.featured,
                   COALESCE(p.badge,'') badge, COALESCE(p.badgeClass,'') badgeClass,
                   p.spicyLevel, p.available, p.status,
                   COALESCE(SUM(bp.stock),0) stock,
                   CASE WHEN COUNT(DISTINCT bp.idBranch) = (SELECT COUNT(*) FROM tbranch WHERE status='ACTIVA')
                        THEN 'Todas las sucursales'
                        ELSE COALESCE(MIN(b.name),'Todas las sucursales') END branch
              FROM tproduct p
              JOIN tcategory c ON c.idCategory=p.idCategory
              LEFT JOIN tbranchproduct bp ON bp.idProduct=p.idProduct AND bp.status <> 'INACTIVO'
              LEFT JOIN tbranch b ON b.idBranch=bp.idBranch
             """ + (onlyPublic ? " WHERE p.status='ACTIVO' AND p.available=1 AND c.status='ACTIVA' " : "") + """
             GROUP BY p.idProduct, p.code, p.name, p.description, c.name, p.price, p.previousPrice,
                      p.imageUrl, p.preparationTime, p.rating, p.reviews, p.featured, p.badge,
                      p.badgeClass, p.spicyLevel, p.available, p.status
             ORDER BY p.featured DESC, p.name
            """;
        List<Map<String, Object>> rows = jdbc.queryForList(sql);
        List<Map<String, Object>> result = new ArrayList<>();
        int fallback = 1;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            String productId = string(row.get("idProduct"));
            String code = string(row.get("code"));
            item.put("id", numericCode(code, fallback++));
            item.put("idProduct", productId);
            item.put("code", code);
            item.put("name", string(row.get("name")));
            item.put("description", string(row.get("description")));
            item.put("category", string(row.get("category")));
            item.put("branch", string(row.get("branch")));
            item.put("price", decimal(row.get("price")).doubleValue());
            BigDecimal previous = nullableDecimal(row.get("previousPrice"));
            item.put("previousPrice", previous == null ? null : previous.doubleValue());
            item.put("stock", integer(row.get("stock")));
            item.put("status", productStatusUi(string(row.get("status"))));
            item.put("imageUrl", string(row.get("imageUrl")));
            item.put("image", string(row.get("imageUrl")));
            item.put("preparationTime", integer(row.get("preparationTime")));
            item.put("rating", decimal(row.get("rating")).doubleValue());
            item.put("reviews", integer(row.get("reviews")));
            item.put("featured", bool(row.get("featured")));
            item.put("badge", string(row.get("badge")));
            item.put("badgeClass", string(row.get("badgeClass")));
            item.put("spicyLevel", integer(row.get("spicyLevel")));
            item.put("available", bool(row.get("available")) && "ACTIVO".equals(string(row.get("status"))));
            item.put("dietaryTags", jdbc.queryForList(
                "SELECT tagName FROM tproductdietarytag WHERE idProduct=? ORDER BY tagName", String.class, productId));
            item.put("ingredients", jdbc.queryForList(
                "SELECT ingredientName FROM tproductingredient WHERE idProduct=? ORDER BY sortOrder, ingredientName", String.class, productId));
            result.add(item);
        }
        return result;
    }

    @Transactional
    public void syncProducts(List<Map<String, Object>> items) {
        int sequence = nextSequence("tproduct", "code");
        for (Map<String, Object> item : safeList(items)) {
            String name = trim(item.get("name"));
            if (name.isBlank()) throw new IllegalArgumentException("El nombre del producto es obligatorio.");
            String categoryName = trim(item.get("category"));
            String categoryId = findId("SELECT idCategory FROM tcategory WHERE LOWER(name)=LOWER(?)", categoryName);
            if (categoryId == null) throw new IllegalArgumentException("Selecciona una categoría válida para " + name + ".");
            String code = trim(item.get("code"));
            if (code.isBlank()) code = "PROD-" + String.format("%04d", sequence++);
            String id = findId("SELECT idProduct FROM tproduct WHERE code=?", code);
            if (id == null) id = UUID.randomUUID().toString();
            String status = productStatusDb(trim(item.get("status")));
            BigDecimal price = decimal(item.get("price"));
            if (price.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("El precio de " + name + " debe ser mayor que cero.");
            int updated = jdbc.update("""
                UPDATE tproduct SET idCategory=?, name=?, description=?, price=?, imageUrl=?,
                       available=?, status=?, updatedAt=NOW()
                 WHERE idProduct=?
                """, categoryId, name, defaultIfBlank(trim(item.get("description")), name),
                price, nullable(item.get("imageUrl")), "ACTIVO".equals(status), status, id);
            if (updated == 0) {
                jdbc.update("""
                    INSERT INTO tproduct
                    (idProduct,idCategory,code,name,description,price,imageUrl,preparationTime,rating,reviews,
                     featured,spicyLevel,available,status,createdAt,updatedAt)
                    VALUES (?,?,?,?,?,?,?,25,0,0,0,0,?,?,NOW(),NOW())
                    """, id, categoryId, code, name,
                    defaultIfBlank(trim(item.get("description")), name),
                    price, nullable(item.get("imageUrl")), "ACTIVO".equals(status), status);
            }

            jdbc.update("DELETE FROM tbranchproduct WHERE idProduct=?", id);
            List<String> branchIds = resolveBranchIds(trim(item.get("branch")));
            if (branchIds.isEmpty()) throw new IllegalArgumentException("Selecciona una sucursal válida para " + name + ".");
            int stock = Math.max(0, integer(item.get("stock")));
            int branchStock = stock;
            for (String branchId : branchIds) {
                jdbc.update("""
                    INSERT INTO tbranchproduct
                    (idBranchProduct,idBranch,idProduct,stock,available,status,createdAt,updatedAt)
                    VALUES (?,?,?,?,?,?,NOW(),NOW())
                    """, UUID.randomUUID().toString(), branchId, id, branchStock, stock > 0, status);
            }
        }
    }

    @Transactional
    public boolean deleteProduct(String code) {
        try {
            String id = findId("SELECT idProduct FROM tproduct WHERE code=?", code);
            if (id == null) return false;
            jdbc.update("DELETE FROM tbranchproduct WHERE idProduct=?", id);
            return jdbc.update("DELETE FROM tproduct WHERE idProduct=?", id) > 0;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    // ---------------------------------------------------------------------
    // CLIENTES
    // ---------------------------------------------------------------------

    public List<Map<String, Object>> getClients() {
        String sql = """
            SELECT c.idClient, c.code, c.firstName, c.surName, c.documentType, c.documentNumber,
                   c.phone, COALESCE(c.email,'') email, COALESCE(c.department,'') department,
                   COALESCE(c.province,'') province, COALESCE(c.district,'') district,
                   COALESCE(c.address,'') address, c.registrationDate, c.status,
                   MAX(DATE(o.createdAt)) lastOrderDate, COUNT(o.idOrder) orderCount,
                   COALESCE(SUM(CASE WHEN o.status <> 'CANCELADO' THEN o.total ELSE 0 END),0) totalSpent
              FROM tclient c
              LEFT JOIN torder o ON o.idClient=c.idClient
             GROUP BY c.idClient, c.code, c.firstName, c.surName, c.documentType, c.documentNumber,
                      c.phone, c.email, c.department, c.province, c.district, c.address,
                      c.registrationDate, c.status
             ORDER BY c.createdAt DESC
            """;
        List<Map<String, Object>> rows = jdbc.queryForList(sql);
        List<Map<String, Object>> result = new ArrayList<>();
        int fallback = 1;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            String code = string(row.get("code"));
            item.put("id", numericCode(code, fallback++));
            item.put("idClient", string(row.get("idClient")));
            item.put("code", code);
            item.put("names", string(row.get("firstName")));
            item.put("surnames", string(row.get("surName")));
            item.put("documentType", string(row.get("documentType")));
            item.put("documentNumber", string(row.get("documentNumber")));
            item.put("phone", string(row.get("phone")));
            item.put("whatsapp", string(row.get("whatsapp")));
            item.put("email", string(row.get("email")));
            item.put("department", string(row.get("department")));
            item.put("province", string(row.get("province")));
            item.put("district", string(row.get("district")));
            item.put("address", string(row.get("address")));
            item.put("registrationDate", sqlDateString(row.get("registrationDate")));
            item.put("lastOrderDate", sqlDateString(row.get("lastOrderDate")));
            item.put("orderCount", integer(row.get("orderCount")));
            item.put("totalSpent", decimal(row.get("totalSpent")).doubleValue());
            item.put("status", clientStatusUi(string(row.get("status"))));
            result.add(item);
        }
        return result;
    }

    @Transactional
    public void syncClients(List<Map<String, Object>> items) {
        int sequence = nextSequence("tclient", "code");
        for (Map<String, Object> item : safeList(items)) {
            String names = trim(item.get("names"));
            String surnames = trim(item.get("surnames"));
            String documentType = trim(item.get("documentType"));
            String documentNumber = trim(item.get("documentNumber"));
            String phone = digits(trim(item.get("phone")));
            if (names.isBlank() || surnames.isBlank()) throw new IllegalArgumentException("Los nombres y apellidos del cliente son obligatorios.");
            if (documentType.isBlank() || documentNumber.length() < 6) throw new IllegalArgumentException("Registra un documento válido para el cliente.");
            if (phone.length() != 9) throw new IllegalArgumentException("El celular del cliente debe tener 9 dígitos.");
            String code = trim(item.get("code"));
            if (code.isBlank()) code = "CLI-" + String.format("%04d", sequence++);
            String id = findId("SELECT idClient FROM tclient WHERE code=?", code);
            if (id == null) id = findId("SELECT idClient FROM tclient WHERE documentType=? AND documentNumber=?",
                documentType, documentNumber);
            if (id == null) id = UUID.randomUUID().toString();
            String status = clientStatusDb(trim(item.get("status")));
            Date registrationDate = sqlDate(trim(item.get("registrationDate")));
            int updated = jdbc.update("""
                UPDATE tclient SET code=?, firstName=?, surName=?, documentType=?, documentNumber=?, email=?, phone=?,
                       department=?, province=?, district=?, address=?, registrationDate=?, status=?, updatedAt=NOW()
                 WHERE idClient=?
                """, code, names, surnames, documentType,
                documentNumber, nullable(item.get("email")), phone,
                nullable(item.get("department")), nullable(item.get("province")), nullable(item.get("district")),
                nullable(item.get("address")), registrationDate == null ? Date.valueOf(LocalDate.now()) : registrationDate,
                status, id);
            if (updated == 0) {
                jdbc.update("""
                    INSERT INTO tclient
                    (idClient,code,firstName,surName,documentType,documentNumber,email,phone,department,province,
                     district,address,registrationDate,status,createdAt,updatedAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())
                    """, id, code, names, surnames, documentType,
                    documentNumber, nullable(item.get("email")), phone,
                    nullable(item.get("department")), nullable(item.get("province")), nullable(item.get("district")),
                    nullable(item.get("address")), registrationDate == null ? Date.valueOf(LocalDate.now()) : registrationDate,
                    status);
            }
        }
    }

    @Transactional
    public boolean deleteClient(String code) {
        try {
            return jdbc.update("DELETE FROM tclient WHERE code=?", code) > 0;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    // ---------------------------------------------------------------------
    // RESERVAS
    // ---------------------------------------------------------------------

    public List<Map<String, Object>> getReservations() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT r.idReservation, r.reservationCode, CONCAT(c.firstName,' ',c.surName) customerName,
                   c.phone customerPhone, b.name branch, r.reservationDate, r.reservationTime,
                   r.numberOfPeople guests, COALESCE(r.occasion,'') occasion,
                   COALESCE(rt.tableNumber,'') tableNumber, r.status, COALESCE(r.notes,'') notes,
                   r.createdAt, r.updatedAt, COALESCE(r.cancellationReason,'') cancellationReason
              FROM treservation r
              JOIN tclient c ON c.idClient=r.idClient
              JOIN tbranch b ON b.idBranch=r.idBranch
              JOIN trestauranttable rt ON rt.idRestaurantTable=r.idRestaurantTable
             ORDER BY r.reservationDate DESC, r.reservationTime DESC
            """);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            String customer = string(row.get("customerName")).trim();
            String date = sqlDateString(row.get("reservationDate"));
            item.put("idReservation", string(row.get("idReservation")));
            item.put("code", string(row.get("reservationCode")));
            item.put("customerName", customer);
            item.put("customerPhone", string(row.get("customerPhone")));
            item.put("customerInitial", customer.isBlank() ? "C" : customer.substring(0, 1).toUpperCase());
            item.put("branch", string(row.get("branch")));
            item.put("date", date);
            item.put("dateLabel", dateLabel(date));
            item.put("time", sqlTimeString(row.get("reservationTime")));
            item.put("guests", integer(row.get("guests")));
            item.put("occasion", string(row.get("occasion")));
            item.put("table", "Mesa " + string(row.get("tableNumber")));
            item.put("status", reservationStatusUi(string(row.get("status"))));
            item.put("notes", string(row.get("notes")));
            item.put("createdAt", dateTimeUi(row.get("createdAt")));
            item.put("updatedAt", dateTimeUi(row.get("updatedAt")));
            String reason = string(row.get("cancellationReason"));
            if (!reason.isBlank()) item.put("cancellationReason", reason);
            result.add(item);
        }
        return result;
    }

    @Transactional
    public void syncReservations(List<Map<String, Object>> items) {
        for (Map<String, Object> item : safeList(items)) {
            String code = trim(item.get("code"));
            String id = findId("SELECT idReservation FROM treservation WHERE reservationCode=?", code);
            if (id == null) {
                throw new IllegalArgumentException("Las reservas nuevas deben registrarse desde el formulario público.");
            }
            String clientId = findId("SELECT idClient FROM treservation WHERE idReservation=?", id);
            String customerName = trim(item.get("customerName"));
            String customerPhone = digits(trim(item.get("customerPhone")));
            if (customerName.length() < 3 || customerPhone.length() != 9) {
                throw new IllegalArgumentException("Revisa el nombre y el celular del cliente.");
            }
            String[] nameParts = customerName.split("\\s+", 2);
            jdbc.update("UPDATE tclient SET firstName=?,surName=?,phone=?,updatedAt=NOW() WHERE idClient=?",
                nameParts[0], nameParts.length > 1 ? nameParts[1] : "", customerPhone, clientId);

            String branchId = resolveBranchId(trim(item.get("branch")));
            if (branchId == null) throw new IllegalArgumentException("Selecciona una sucursal válida.");
            int guests = integer(item.get("guests"));
            if (guests < 1 || guests > 20) throw new IllegalArgumentException("La reserva admite entre 1 y 20 personas.");
            String tableId = resolveTableId(branchId, trim(item.get("table")), guests);
            if (tableId == null) throw new IllegalArgumentException("Selecciona una mesa válida.");
            Date date = sqlDate(trim(item.get("date")));
            Time time = sqlTime(trim(item.get("time")));
            if (date == null || time == null) throw new IllegalArgumentException("Selecciona una fecha y hora válidas.");
            String status = reservationStatusDb(trim(item.get("status")));
            jdbc.update("""
                UPDATE treservation SET idBranch=?, idRestaurantTable=?, reservationDate=?,
                       reservationTime=?, numberOfPeople=?, occasion=?, notes=?, status=?, cancellationReason=?, updatedAt=NOW()
                 WHERE idReservation=?
                """, branchId, tableId, date, time, guests, nullable(item.get("occasion")),
                nullable(item.get("notes")), status, nullable(item.get("cancellationReason")), id);
        }
    }

    @Transactional
    public Map<String, Object> createPublicReservation(Map<String, Object> item) {
        Date date = sqlDate(trim(item.get("date")));
        Time time = sqlTime(trim(item.get("time")));
        if (date == null || time == null) {
            throw new IllegalArgumentException("Selecciona una fecha y hora válidas.");
        }
        if (date.toLocalDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de la reserva no puede estar en el pasado.");
        }

        String firstName = trim(item.get("firstName"));
        String lastName = trim(item.get("lastName"));
        String documentType = defaultIfBlank(trim(item.get("documentType")), "DNI");
        String documentNumber = trim(item.get("documentNumber"));
        String phone = digits(trim(item.get("phone")));
        String email = trim(item.get("email"));
        if (firstName.isBlank() || lastName.isBlank()) throw new IllegalArgumentException("Ingresa los nombres y apellidos.");
        if (documentNumber.length() < 6) throw new IllegalArgumentException("Ingresa un número de documento válido.");
        if (phone.length() != 9) throw new IllegalArgumentException("El celular debe tener 9 dígitos.");
        if (email.isBlank() || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw new IllegalArgumentException("Ingresa un correo electrónico válido.");
        if (!bool(item.get("acceptPrivacy")) || !bool(item.get("acceptConditions"))) {
            throw new IllegalArgumentException("Debes aceptar la política de privacidad y las condiciones de reserva.");
        }
        String clientId = ensureClient(firstName, lastName, documentType, documentNumber, phone, email);
        String branchId = trim(item.get("branchId"));
        if (findId("SELECT idBranch FROM tbranch WHERE idBranch=? AND status='ACTIVA'", branchId) == null) {
            branchId = resolveBranchId(trim(item.get("branch")));
        }
        if (branchId == null || findId("SELECT idBranch FROM tbranch WHERE idBranch=? AND status='ACTIVA'", branchId) == null) {
            throw new IllegalArgumentException("La sucursal seleccionada no existe o está inactiva.");
        }
        int people = integer(item.get("people"));
        if (people < 1 || people > 20) throw new IllegalArgumentException("La reserva admite entre 1 y 20 personas.");
        String tableId = findAvailableTable(branchId, date, time, people);
        if (tableId == null) throw new IllegalArgumentException("No hay mesas disponibles para la fecha, hora y cantidad de personas seleccionadas.");
        String id = UUID.randomUUID().toString();
        String code = nextReservationCode();
        jdbc.update("""
            INSERT INTO treservation
            (idReservation,reservationCode,idClient,idBranch,idRestaurantTable,reservationDate,reservationTime,
             numberOfPeople,occasion,contactPreference,notes,depositAmount,paymentReference,acceptPrivacy,
             acceptConditions,status,createdAt,updatedAt)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'PENDIENTE',NOW(),NOW())
            """, id, code, clientId, branchId, tableId, date, time, people, nullable(item.get("occasion")),
            nullable(item.get("contactPreference")), nullable(item.get("notes")),
            decimal(item.get("depositAmount")), nullable(item.get("paymentReference")),
            bool(item.get("acceptPrivacy")), bool(item.get("acceptConditions")));

        String paymentMethod = trim(item.get("paymentMethod"));
        BigDecimal depositAmount = decimal(item.get("depositAmount"));
        if (paymentMethod.isBlank() || depositAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Selecciona un método de pago y registra un adelanto válido.");
        }
        String paymentMethodId = resolvePaymentMethodId(paymentMethod);
        if (paymentMethodId == null) throw new IllegalArgumentException("El método de pago seleccionado no existe.");
        jdbc.update("""
            INSERT INTO tpayment
            (idPayment,idReservation,idPaymentMethod,amount,reference,operationDate,status,createdAt,updatedAt)
            VALUES (?,?,?,?,?,NOW(),'PENDIENTE',NOW(),NOW())
            """, UUID.randomUUID().toString(), id, paymentMethodId, depositAmount, nullable(item.get("paymentReference")));
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("idReservation", id);
        response.put("code", code);
        response.put("reservationCode", code);
        response.put("table", jdbc.queryForObject("SELECT tableNumber FROM trestauranttable WHERE idRestaurantTable=?", String.class, tableId));
        return response;
    }

    // ---------------------------------------------------------------------
    // MESAS DEL RESTAURANTE
    // ---------------------------------------------------------------------

    public List<Map<String, Object>> getTables() {
        String sql = """
            SELECT rt.idRestaurantTable, rt.idBranch, rt.tableNumber, rt.capacity,
                   rt.location, rt.status, b.code branchCode, b.name branchName
              FROM trestauranttable rt
              JOIN tbranch b ON b.idBranch = rt.idBranch
             ORDER BY b.name, rt.tableNumber
            """;
        List<Map<String, Object>> rows = jdbc.queryForList(sql);
        List<Map<String, Object>> result = new ArrayList<>();
        int fallback = 1;
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", fallback++);
            item.put("idRestaurantTable", string(row.get("idRestaurantTable")));
            item.put("idBranch", string(row.get("idBranch")));
            item.put("branchCode", string(row.get("branchCode")));
            item.put("branch", string(row.get("branchName")));
            item.put("tableNumber", string(row.get("tableNumber")));
            item.put("capacity", integer(row.get("capacity")));
            item.put("location", string(row.get("location")));
            item.put("status", string(row.get("status")));
            result.add(item);
        }
        return result;
    }

    @Transactional
    public void syncTables(List<Map<String, Object>> items) {
        for (Map<String, Object> item : safeList(items)) {
            String id = trim(item.get("idRestaurantTable"));
            String branchId = trim(item.get("idBranch"));
            if (branchId.isBlank()) {
                branchId = findId("SELECT idBranch FROM tbranch WHERE code=? OR LOWER(name)=LOWER(?)",
                    trim(item.get("branchCode")), trim(item.get("branch")));
            }
            if (branchId == null || branchId.isBlank()) {
                throw new IllegalArgumentException("Selecciona una sucursal válida para la mesa.");
            }
            String tableNumber = trim(item.get("tableNumber"));
            if (tableNumber.isBlank()) {
                throw new IllegalArgumentException("El número de mesa es obligatorio.");
            }
            if (id.isBlank()) {
                id = findId("SELECT idRestaurantTable FROM trestauranttable WHERE idBranch=? AND tableNumber=?",
                    branchId, tableNumber);
            }
            if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
            int capacity = Math.max(1, integer(item.get("capacity")));
            String location = defaultIfBlank(trim(item.get("location")), "Salón principal");
            String status = trim(item.get("status")).toUpperCase();
            if (!List.of("DISPONIBLE", "OCUPADA", "RESERVADA", "MANTENIMIENTO", "INACTIVA").contains(status)) {
                status = "DISPONIBLE";
            }
            int updated = jdbc.update("""
                UPDATE trestauranttable
                   SET idBranch=?, tableNumber=?, capacity=?, location=?, status=?, updatedAt=NOW()
                 WHERE idRestaurantTable=?
                """, branchId, tableNumber, capacity, location, status, id);
            if (updated == 0) {
                jdbc.update("""
                    INSERT INTO trestauranttable
                    (idRestaurantTable,idBranch,tableNumber,capacity,location,status,createdAt,updatedAt)
                    VALUES (?,?,?,?,?,?,NOW(),NOW())
                    """, id, branchId, tableNumber, capacity, location, status);
            }
            refreshBranchTableCount(branchId);
        }
    }

    @Transactional
    public boolean deleteTable(String id) {
        try {
            String branchId = findId("SELECT idBranch FROM trestauranttable WHERE idRestaurantTable=?", id);
            boolean deleted = jdbc.update("DELETE FROM trestauranttable WHERE idRestaurantTable=?", id) > 0;
            if (deleted && branchId != null) refreshBranchTableCount(branchId);
            return deleted;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    private void refreshBranchTableCount(String branchId) {
        jdbc.update("""
            UPDATE tbranch b
               SET b.tableCount=(SELECT COUNT(*) FROM trestauranttable rt WHERE rt.idBranch=b.idBranch),
                   b.updatedAt=NOW()
             WHERE b.idBranch=?
            """, branchId);
    }

    public Map<String, Object> getActivePromotion() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT pr.idPromotion, pr.code promotionCode, pr.title, pr.description,
                   pr.price, pr.previousPrice, COALESCE(pr.discountLabel, '') discount,
                   COALESCE(pr.imageUrl, p.imageUrl, '') image,
                   p.idProduct, p.code productCode, p.name productName
              FROM tpromotion pr
              JOIN tproduct p ON p.idProduct=pr.idProduct
             WHERE pr.status='ACTIVA'
               AND p.status='ACTIVO' AND p.available=1
               AND (pr.startDate IS NULL OR pr.startDate<=CURRENT_DATE)
               AND (pr.endDate IS NULL OR pr.endDate>=CURRENT_DATE)
             ORDER BY pr.updatedAt DESC
             LIMIT 1
            """);
        if (rows.isEmpty()) return null;
        Map<String, Object> row = rows.getFirst();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("idPromotion", string(row.get("idPromotion")));
        result.put("code", string(row.get("promotionCode")));
        result.put("title", string(row.get("title")));
        result.put("description", string(row.get("description")));
        result.put("price", decimal(row.get("price")).doubleValue());
        result.put("previousPrice", nullableDecimal(row.get("previousPrice")) == null
            ? null : nullableDecimal(row.get("previousPrice")).doubleValue());
        result.put("discount", string(row.get("discount")));
        result.put("image", string(row.get("image")));
        result.put("idProduct", string(row.get("idProduct")));
        result.put("productCode", string(row.get("productCode")));
        result.put("productName", string(row.get("productName")));
        result.put("includes", jdbc.queryForList(
            "SELECT itemDescription FROM tpromotionitem WHERE idPromotion=? ORDER BY sortOrder,itemDescription",
            String.class, string(row.get("idPromotion"))));
        return result;
    }

    public List<Map<String, Object>> getPromotions() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT pr.idPromotion, pr.idProduct, pr.code, pr.title, pr.description,
                   pr.price, pr.previousPrice, COALESCE(pr.discountLabel,'') discount,
                   COALESCE(pr.imageUrl,p.imageUrl,'') image,
                   DATE_FORMAT(pr.startDate,'%Y-%m-%d') startDate,
                   DATE_FORMAT(pr.endDate,'%Y-%m-%d') endDate,
                   pr.status, p.name productName, p.code productCode
              FROM tpromotion pr
              JOIN tproduct p ON p.idProduct=pr.idProduct
             ORDER BY pr.updatedAt DESC
            """);
        for (Map<String, Object> row : rows) {
            row.put("includes", jdbc.queryForList(
                "SELECT itemDescription FROM tpromotionitem WHERE idPromotion=? ORDER BY sortOrder,itemDescription",
                String.class, string(row.get("idPromotion"))));
        }
        return rows;
    }

    @Transactional
    public void syncPromotions(List<Map<String, Object>> items) {
        int sequence = nextSequence("tpromotion", "code");
        for (Map<String, Object> item : safeList(items)) {
            String id = trim(item.get("idPromotion"));
            String code = trim(item.get("code"));
            if (code.isBlank()) code = "PROM-" + String.format("%03d", sequence++);
            if (id.isBlank()) id = findId("SELECT idPromotion FROM tpromotion WHERE code=?", code);
            if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
            String productId = trim(item.get("idProduct"));
            if (productId.isBlank() || findId("SELECT idProduct FROM tproduct WHERE idProduct=?", productId) == null) {
                throw new IllegalArgumentException("Selecciona un producto válido para la promoción.");
            }
            String title = trim(item.get("title"));
            if (title.isBlank()) throw new IllegalArgumentException("El título de la promoción es obligatorio.");
            BigDecimal price = decimal(item.get("price"));
            if (price.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("El precio de la promoción debe ser mayor que cero.");
            BigDecimal previousPrice = nullableDecimal(item.get("previousPrice"));
            Date startDate = sqlDate(trim(item.get("startDate")));
            Date endDate = sqlDate(trim(item.get("endDate")));
            if (startDate != null && endDate != null && endDate.before(startDate)) {
                throw new IllegalArgumentException("La fecha final no puede ser anterior a la fecha inicial.");
            }
            String status = trim(item.get("status")).toUpperCase();
            if (!List.of("ACTIVA", "INACTIVA", "FINALIZADA").contains(status)) status = "INACTIVA";

            int updated = jdbc.update("""
                UPDATE tpromotion
                   SET idProduct=?, code=?, title=?, description=?, price=?, previousPrice=?,
                       discountLabel=?, imageUrl=?, startDate=?, endDate=?, status=?, updatedAt=NOW()
                 WHERE idPromotion=?
                """, productId, code, title, defaultIfBlank(trim(item.get("description")), title),
                price, previousPrice, nullable(item.get("discount")), nullable(item.get("image")),
                startDate, endDate, status, id);
            if (updated == 0) {
                jdbc.update("""
                    INSERT INTO tpromotion
                    (idPromotion,idProduct,code,title,description,price,previousPrice,discountLabel,imageUrl,startDate,endDate,status,createdAt,updatedAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())
                    """, id, productId, code, title, defaultIfBlank(trim(item.get("description")), title),
                    price, previousPrice, nullable(item.get("discount")), nullable(item.get("image")),
                    startDate, endDate, status);
            }

            jdbc.update("DELETE FROM tpromotionitem WHERE idPromotion=?", id);
            Object includesValue = item.get("includes");
            List<?> includes = includesValue instanceof List<?> list ? list : List.of();
            int order = 1;
            for (Object include : includes) {
                String description = trim(include);
                if (description.isBlank()) continue;
                jdbc.update("""
                    INSERT INTO tpromotionitem
                    (idPromotionItem,idPromotion,itemDescription,sortOrder,createdAt,updatedAt)
                    VALUES (?,?,?,?,NOW(),NOW())
                    """, UUID.randomUUID().toString(), id, description, order++);
            }
        }
    }

    public boolean deletePromotion(String idOrCode) {
        try {
            return jdbc.update("DELETE FROM tpromotion WHERE idPromotion=? OR code=?", idOrCode, idOrCode) > 0;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    public List<Map<String, Object>> availableTables(String branchId, String date, String time, int people) {
        Date d = sqlDate(date);
        Time t = sqlTime(time);
        if (d == null || t == null || branchId == null || branchId.isBlank()) return List.of();
        return jdbc.queryForList("""
            SELECT rt.idRestaurantTable, rt.tableNumber, rt.capacity, rt.location
              FROM trestauranttable rt
             WHERE rt.idBranch=? AND rt.status='DISPONIBLE' AND rt.capacity>=?
               AND NOT EXISTS (
                   SELECT 1 FROM treservation r
                    WHERE r.idRestaurantTable=rt.idRestaurantTable
                      AND r.reservationDate=? AND r.reservationTime=?
                      AND r.status IN ('PENDIENTE','CONFIRMADA','REPROGRAMADA')
               )
             ORDER BY rt.capacity, rt.tableNumber
            """, branchId, people, d, t);
    }

    // ---------------------------------------------------------------------
    // PEDIDOS
    // ---------------------------------------------------------------------

    public List<Map<String, Object>> getOrders() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT o.idOrder, o.orderCode, CONCAT(c.firstName,' ',c.surName) customerName, c.phone customerPhone,
                   o.orderType, b.name branch, o.createdAt, o.updatedAt, COALESCE(pm.name,'Efectivo') payment,
                   o.total, o.status, COALESCE(o.deliveryAddress,'Recojo en sucursal') address,
                   COALESCE(o.deliveryReference,'') reference, COALESCE(o.notes,'') notes,
                   COALESCE(o.cancellationReason,'') cancellationReason
              FROM torder o
              JOIN tclient c ON c.idClient=o.idClient
              JOIN tbranch b ON b.idBranch=o.idBranch
              LEFT JOIN tpaymentmethod pm ON pm.idPaymentMethod=o.idPaymentMethod
             ORDER BY o.createdAt DESC
            """);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String orderId = string(row.get("idOrder"));
            String customer = string(row.get("customerName")).trim();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("idOrder", orderId);
            item.put("code", string(row.get("orderCode")));
            item.put("customerName", customer);
            item.put("customerPhone", string(row.get("customerPhone")));
            item.put("customerInitial", customer.isBlank() ? "C" : customer.substring(0,1).toUpperCase());
            item.put("type", "DELIVERY".equals(string(row.get("orderType"))) ? "Delivery" : "Recojo");
            item.put("branch", string(row.get("branch")));
            item.put("dateTime", dateTimeUi(row.get("createdAt")));
            item.put("updatedAt", dateTimeUi(row.get("updatedAt")));
            item.put("payment", paymentUi(string(row.get("payment"))));
            item.put("total", decimal(row.get("total")).doubleValue());
            item.put("status", orderStatusUi(string(row.get("status"))));
            item.put("address", string(row.get("address")));
            item.put("reference", string(row.get("reference")));
            item.put("notes", string(row.get("notes")));
            String reason = string(row.get("cancellationReason"));
            if (!reason.isBlank()) item.put("cancellationReason", reason);
            item.put("products", jdbc.query("""
                SELECT COALESCE(od.productNameSnapshot,p.name) name, od.quantity, od.unitPrice
                  FROM torderdetail od JOIN tproduct p ON p.idProduct=od.idProduct
                 WHERE od.idOrder=? ORDER BY od.createdAt
                """, (rs, n) -> Map.of(
                    "name", rs.getString("name"),
                    "quantity", rs.getInt("quantity"),
                    "unitPrice", rs.getBigDecimal("unitPrice").doubleValue()), orderId));
            item.put("history", jdbc.query("""
                SELECT status, changedAt, COALESCE(note,'') note
                  FROM torderstatushistory WHERE idOrder=? ORDER BY changedAt
                """, (rs, n) -> Map.of(
                    "status", orderStatusUi(rs.getString("status")),
                    "dateTime", dateTimeUi(rs.getTimestamp("changedAt")),
                    "note", rs.getString("note")), orderId));
            result.add(item);
        }
        return result;
    }

    @Transactional
    public void syncOrders(List<Map<String, Object>> items) {
        for (Map<String, Object> item : safeList(items)) {
            String code = trim(item.get("code"));
            if (code.isBlank()) continue;
            String id = findId("SELECT idOrder FROM torder WHERE orderCode=?", code);
            if (id == null) continue;

            String status = orderStatusDb(trim(item.get("status")));
            String type = "Delivery".equalsIgnoreCase(trim(item.get("type"))) ? "DELIVERY" : "RECOJO";
            jdbc.update("""
                UPDATE torder
                   SET orderType=?, deliveryAddress=?, deliveryReference=?, notes=?, cancellationReason=?,
                       status=?, updatedAt=NOW()
                 WHERE idOrder=?
                """,
                type,
                "DELIVERY".equals(type) ? nullable(item.get("address")) : null,
                "DELIVERY".equals(type) ? nullable(item.get("reference")) : null,
                nullable(item.get("notes")),
                nullable(item.get("cancellationReason")),
                status,
                id
            );
        }
    }

    @Transactional
    public Map<String, Object> createPublicOrder(Map<String, Object> item) {
        String branchId = resolveBranchId(trim(item.get("branchId")));
        if (branchId == null || findId("SELECT idBranch FROM tbranch WHERE idBranch=? AND status='ACTIVA'", branchId) == null) {
            throw new IllegalArgumentException("Selecciona una sucursal activa.");
        }

        String firstName = trim(item.get("firstName"));
        String lastName = trim(item.get("lastName"));
        String documentType = defaultIfBlank(trim(item.get("documentType")), "DNI");
        String documentNumber = trim(item.get("documentNumber"));
        if (firstName.isBlank() || lastName.isBlank()) {
            throw new IllegalArgumentException("Ingresa los nombres y apellidos del cliente.");
        }
        if (documentNumber.length() < 6) {
            throw new IllegalArgumentException("Ingresa un número de documento válido.");
        }
        String phone = digits(trim(item.get("phone")));
        if (phone.length() != 9) {
            throw new IllegalArgumentException("El celular debe tener 9 dígitos.");
        }

        String clientId = ensureClient(
            firstName,
            lastName,
            documentType,
            documentNumber,
            phone,
            nullable(item.get("email"))
        );

        Object rawProducts = item.get("products");
        List<Map<String, Object>> requestedProducts = rawProducts instanceof List<?> list
            ? castMapList(list)
            : List.of();
        if (requestedProducts.isEmpty()) {
            throw new IllegalArgumentException("Agrega al menos un producto al carrito.");
        }

        List<Map<String, Object>> details = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (Map<String, Object> requested : requestedProducts) {
            String idProduct = trim(requested.get("idProduct"));
            String code = trim(requested.get("code"));
            String name = trim(requested.get("name"));

            List<Map<String, Object>> matches;
            if (!idProduct.isBlank()) {
                matches = jdbc.queryForList("SELECT idProduct,code,name,price,status,available FROM tproduct WHERE idProduct=?", idProduct);
            } else if (!code.isBlank()) {
                matches = jdbc.queryForList("SELECT idProduct,code,name,price,status,available FROM tproduct WHERE code=?", code);
            } else {
                matches = jdbc.queryForList("SELECT idProduct,code,name,price,status,available FROM tproduct WHERE LOWER(name)=LOWER(?)", name);
            }

            if (matches.isEmpty()) {
                throw new IllegalArgumentException("No se encontró el producto " + defaultIfBlank(name, code) + ".");
            }

            Map<String, Object> product = matches.getFirst();
            if (!"ACTIVO".equalsIgnoreCase(string(product.get("status"))) || !bool(product.get("available"))) {
                throw new IllegalArgumentException("El producto " + string(product.get("name")) + " no está disponible.");
            }

            int quantity = Math.max(1, integer(requested.get("quantity")));
            List<Map<String, Object>> inventoryRows = jdbc.queryForList("""
                SELECT COALESCE(bp.branchPrice,p.price) unitPrice,bp.stock,bp.available,bp.status
                  FROM tbranchproduct bp JOIN tproduct p ON p.idProduct=bp.idProduct
                 WHERE bp.idBranch=? AND bp.idProduct=?
                """, branchId, string(product.get("idProduct")));
            if (inventoryRows.isEmpty()) {
                throw new IllegalArgumentException("El producto " + string(product.get("name")) + " no está habilitado en la sucursal seleccionada.");
            }
            Map<String, Object> inventory = inventoryRows.getFirst();
            int availableStock = integer(inventory.get("stock"));
            if (!bool(inventory.get("available")) || !"ACTIVO".equalsIgnoreCase(string(inventory.get("status"))) || availableStock < quantity) {
                throw new IllegalArgumentException("Stock insuficiente para " + string(product.get("name")) + ". Disponible: " + availableStock + ".");
            }
            BigDecimal unitPrice = decimal(inventory.get("unitPrice"));
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            subtotal = subtotal.add(lineTotal);

            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("idProduct", string(product.get("idProduct")));
            detail.put("code", string(product.get("code")));
            detail.put("name", string(product.get("name")));
            detail.put("quantity", quantity);
            detail.put("unitPrice", unitPrice);
            detail.put("subtotal", lineTotal);
            details.add(detail);
        }

        String type = trim(item.get("orderType")).equalsIgnoreCase("Delivery") ? "DELIVERY" : "RECOJO";
        if ("DELIVERY".equals(type) && trim(item.get("address")).isBlank()) {
            throw new IllegalArgumentException("Ingresa la dirección de entrega.");
        }
        BigDecimal deliveryCost = "DELIVERY".equals(type) ? new BigDecimal("5.00") : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(deliveryCost);
        String paymentMethod = trim(item.get("paymentMethod"));
        if (paymentMethod.isBlank()) throw new IllegalArgumentException("Selecciona un método de pago.");
        String paymentMethodId = resolvePaymentMethodId(paymentMethod);
        if (paymentMethodId == null) throw new IllegalArgumentException("Selecciona un método de pago válido.");
        String idOrder = UUID.randomUUID().toString();
        String orderCode = nextOrderCode();
        int estimatedMinutes = "DELIVERY".equals(type) ? 40 : 30;

        jdbc.update("""
            INSERT INTO torder
            (idOrder,orderCode,idClient,idBranch,idPaymentMethod,orderType,deliveryAddress,deliveryReference,
             subtotal,deliveryCost,total,notes,estimatedMinutes,status,confirmedAt,createdAt,updatedAt)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'CONFIRMADO',NOW(),NOW(),NOW())
            """,
            idOrder, orderCode, clientId, branchId, paymentMethodId, type,
            "DELIVERY".equals(type) ? nullable(item.get("address")) : null,
            "DELIVERY".equals(type) ? nullable(item.get("reference")) : null,
            subtotal, deliveryCost, total, nullable(item.get("notes")), estimatedMinutes
        );

        for (Map<String, Object> detail : details) {
            jdbc.update("""
                INSERT INTO torderdetail
                (idOrderDetail,idOrder,idProduct,productNameSnapshot,quantity,unitPrice,subtotal,createdAt,updatedAt)
                VALUES (?,?,?,?,?,?,?,NOW(),NOW())
                """,
                UUID.randomUUID().toString(), idOrder, detail.get("idProduct"), detail.get("name"),
                detail.get("quantity"), detail.get("unitPrice"), detail.get("subtotal")
            );

            jdbc.update("""
                UPDATE tbranchproduct
                   SET stock=GREATEST(stock-?,0),
                       available=CASE WHEN GREATEST(stock-?,0)>0 THEN 1 ELSE 0 END,
                       updatedAt=NOW()
                 WHERE idBranch=? AND idProduct=?
                """,
                detail.get("quantity"), detail.get("quantity"), branchId, detail.get("idProduct")
            );
        }

        if (paymentMethodId != null) {
            jdbc.update("""
                INSERT INTO tpayment
                (idPayment,idOrder,idReservation,idPaymentMethod,amount,reference,operationDate,notes,status,createdAt,updatedAt)
                VALUES (?,?,NULL,?,?,?,NOW(),?,'PENDIENTE',NOW(),NOW())
                """,
                UUID.randomUUID().toString(), idOrder, paymentMethodId, total,
                nullable(item.get("paymentReference")), "Pago registrado desde la tienda web"
            );
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("code", orderCode);
        response.put("phone", phone);
        response.put("subtotal", subtotal.doubleValue());
        response.put("deliveryCost", deliveryCost.doubleValue());
        response.put("total", total.doubleValue());
        response.put("estimatedMinutes", estimatedMinutes);
        response.put("status", "Confirmado");
        return response;
    }

    public Map<String, Object> trackOrder(String code, String phone) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT o.idOrder,o.orderCode,o.status,o.orderType,o.estimatedMinutes,o.updatedAt,
                   CONCAT(c.firstName,' ',c.surName) customer,b.name branch
              FROM torder o JOIN tclient c ON c.idClient=o.idClient JOIN tbranch b ON b.idBranch=o.idBranch
             WHERE UPPER(o.orderCode)=UPPER(?) AND REPLACE(REPLACE(REPLACE(c.phone,' ',''),'-',''),'+','')=?
            """, code, digits(phone));
        if (rows.isEmpty()) return null;
        Map<String, Object> row = rows.getFirst();
        String statusDb = string(row.get("status"));
        String typeDb = string(row.get("orderType"));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("code", string(row.get("orderCode")));
        result.put("phone", digits(phone));
        result.put("status", trackingStatus(statusDb, typeDb));
        result.put("icon", trackingIcon(statusDb, typeDb));
        result.put("color", trackingColor(statusDb));
        result.put("customer", string(row.get("customer")));
        result.put("branch", string(row.get("branch")));
        result.put("orderType", "DELIVERY".equals(typeDb) ? "Delivery" : "Recojo en tienda");
        Integer minutes = row.get("estimatedMinutes") == null ? null : integer(row.get("estimatedMinutes"));
        result.put("estimatedTime", "ENTREGADO".equals(statusDb) ? "Entregado" : minutes == null ? "20 a 35 minutos" : minutes + " minutos");
        result.put("updatedAt", timeUi(row.get("updatedAt")));
        result.put("steps", trackingSteps(statusDb, typeDb));
        return result;
    }

    // ---------------------------------------------------------------------
    // PAGOS
    // ---------------------------------------------------------------------

    public List<Map<String, Object>> getPayments() {
        return jdbc.queryForList("""
            SELECT p.idPayment,
                   CASE WHEN p.idOrder IS NOT NULL THEN 'PEDIDO' ELSE 'RESERVA' END sourceType,
                   COALESCE(o.orderCode, r.reservationCode) sourceCode,
                   CONCAT(c.firstName, ' ', c.surName) customer,
                   b.name branch,
                   pm.name paymentMethod,
                   p.amount, COALESCE(p.reference,'') reference,
                   DATE_FORMAT(p.operationDate, '%Y-%m-%dT%H:%i') operationDate,
                   COALESCE(p.notes,'') notes, p.status,
                   p.createdAt, p.updatedAt
              FROM tpayment p
              LEFT JOIN torder o ON o.idOrder=p.idOrder
              LEFT JOIN treservation r ON r.idReservation=p.idReservation
              JOIN tpaymentmethod pm ON pm.idPaymentMethod=p.idPaymentMethod
              JOIN tclient c ON c.idClient=COALESCE(o.idClient,r.idClient)
              JOIN tbranch b ON b.idBranch=COALESCE(o.idBranch,r.idBranch)
             ORDER BY p.createdAt DESC
            """);
    }

    @Transactional
    public void syncPayments(List<Map<String, Object>> items) {
        for (Map<String, Object> item : safeList(items)) {
            String id = trim(item.get("idPayment"));
            if (id.isBlank()) continue;
            String status = trim(item.get("status")).toUpperCase();
            if (!List.of("PENDIENTE", "APROBADO", "RECHAZADO", "ANULADO").contains(status)) {
                status = "PENDIENTE";
            }
            Timestamp operationDate = timestamp(item.get("operationDate"));
            jdbc.update("""
                UPDATE tpayment
                   SET reference=?, operationDate=?, notes=?, status=?, updatedAt=NOW()
                 WHERE idPayment=?
                """, nullable(item.get("reference")), operationDate,
                nullable(item.get("notes")), status, id);
        }
    }

    // ---------------------------------------------------------------------
    // DASHBOARD Y REPORTES
    // ---------------------------------------------------------------------

    public Map<String, Object> dashboard() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("ordersToday", integer(jdbc.queryForObject("SELECT COUNT(*) FROM torder WHERE DATE(createdAt)=CURRENT_DATE", Integer.class)));
        data.put("salesToday", decimal(jdbc.queryForObject("SELECT COALESCE(SUM(total),0) FROM torder WHERE DATE(createdAt)=CURRENT_DATE AND status<>'CANCELADO'", BigDecimal.class)).doubleValue());
        data.put("pendingOrders", integer(jdbc.queryForObject("SELECT COUNT(*) FROM torder WHERE status IN ('PENDIENTE','CONFIRMADO','EN_PREPARACION','LISTO','EN_CAMINO')", Integer.class)));
        data.put("reservationsToday", integer(jdbc.queryForObject("SELECT COUNT(*) FROM treservation WHERE reservationDate=CURRENT_DATE AND status<>'CANCELADA'", Integer.class)));
        data.put("activeClients", integer(jdbc.queryForObject("SELECT COUNT(*) FROM tclient WHERE status='ACTIVO'", Integer.class)));
        data.put("activeProducts", integer(jdbc.queryForObject("SELECT COUNT(*) FROM tproduct WHERE status='ACTIVO'", Integer.class)));
        data.put("ordersByStatus", jdbc.queryForList("SELECT status,COUNT(*) count FROM torder GROUP BY status"));
        data.put("reservationsByStatus", jdbc.queryForList("SELECT status,COUNT(*) count FROM treservation GROUP BY status"));
        data.put("ordersByBranch", jdbc.queryForList("""
            SELECT b.name branch,COUNT(o.idOrder) orders,COALESCE(SUM(o.total),0) sales
              FROM tbranch b LEFT JOIN torder o ON o.idBranch=b.idBranch AND o.status<>'CANCELADO'
             GROUP BY b.idBranch,b.name ORDER BY orders DESC
            """));
        data.put("popularProducts", jdbc.queryForList("""
            SELECT COALESCE(od.productNameSnapshot,p.name) name,SUM(od.quantity) quantity,
                   SUM(od.subtotal) sales
              FROM torderdetail od JOIN torder o ON o.idOrder=od.idOrder JOIN tproduct p ON p.idProduct=od.idProduct
             WHERE o.status<>'CANCELADO' GROUP BY COALESCE(od.productNameSnapshot,p.name)
             ORDER BY quantity DESC LIMIT 5
            """));
        return data;
    }

    public Map<String, Object> reports(String from, String to) {
        Date start = sqlDate(from);
        Date end = sqlDate(to);
        if (start == null) start = Date.valueOf(LocalDate.now().minusMonths(6));
        if (end == null) end = Date.valueOf(LocalDate.now());
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("sales", jdbc.queryForList("""
            SELECT DATE(o.createdAt) date,o.orderCode,b.department branch,CONCAT(c.firstName,' ',c.surName) customer,
                   COALESCE(od.productNameSnapshot,p.name) product,cat.name category,od.quantity,od.subtotal amount,
                   COALESCE(pm.name,'Efectivo') paymentMethod,o.status
              FROM torder o JOIN tclient c ON c.idClient=o.idClient JOIN tbranch b ON b.idBranch=o.idBranch
              JOIN torderdetail od ON od.idOrder=o.idOrder JOIN tproduct p ON p.idProduct=od.idProduct
              JOIN tcategory cat ON cat.idCategory=p.idCategory
              LEFT JOIN tpaymentmethod pm ON pm.idPaymentMethod=o.idPaymentMethod
             WHERE DATE(o.createdAt) BETWEEN ? AND ? ORDER BY o.createdAt DESC
            """, start, end));
        data.put("reservations", jdbc.queryForList("""
            SELECT r.reservationDate date,r.reservationCode code,b.department branch,
                   CONCAT(c.firstName,' ',c.surName) customer,r.numberOfPeople people,r.status
              FROM treservation r JOIN tclient c ON c.idClient=r.idClient JOIN tbranch b ON b.idBranch=r.idBranch
             WHERE r.reservationDate BETWEEN ? AND ? ORDER BY r.reservationDate DESC
            """, start, end));
        data.put("clients", jdbc.queryForList("SELECT idClient id,registrationDate,COALESCE(department,'') department,status FROM tclient"));
        return data;
    }

    // ---------------------------------------------------------------------
    // AUXILIARES
    // ---------------------------------------------------------------------

    private String ensureClient(String firstName, String lastName, String documentType, String documentNumber, String phone, String email) {
        String id = null;
        if (!documentNumber.isBlank()) id = findId("SELECT idClient FROM tclient WHERE documentType=? AND documentNumber=?", documentType, documentNumber);
        if (id == null && !phone.isBlank()) id = findId("SELECT idClient FROM tclient WHERE phone=? LIMIT 1", phone);
        if (id == null && email != null && !email.isBlank()) id = findId("SELECT idClient FROM tclient WHERE LOWER(email)=LOWER(?) LIMIT 1", email);
        if (id == null) {
            id = UUID.randomUUID().toString();
            String code = "CLI-" + String.format("%04d", nextSequence("tclient", "code"));
            String safeDocType = defaultIfBlank(documentType, "DNI");
            String safeDoc = defaultIfBlank(documentNumber, "TEL-" + digits(phone));
            jdbc.update("""
                INSERT INTO tclient
                (idClient,code,firstName,surName,documentType,documentNumber,email,phone,registrationDate,status,createdAt,updatedAt)
                VALUES (?,?,?,?,?,?,?,?,CURRENT_DATE,'ACTIVO',NOW(),NOW())
                """, id, code, defaultIfBlank(firstName, "Cliente"), defaultIfBlank(lastName, "Sabor Andino"),
                safeDocType, safeDoc, email.isBlank() ? null : email, defaultIfBlank(phone, "000000000"));
        } else {
            jdbc.update("UPDATE tclient SET firstName=?,surName=?,email=COALESCE(NULLIF(?,''),email),phone=?,updatedAt=NOW() WHERE idClient=?",
                defaultIfBlank(firstName,"Cliente"), defaultIfBlank(lastName,"Sabor Andino"), email,
                defaultIfBlank(phone,"000000000"), id);
        }
        return id;
    }

    private String ensureClientByPhone(String fullName, String phone) {
        String cleanName = defaultIfBlank(fullName, "Cliente Sabor Andino").trim();
        String[] parts = cleanName.split("\\s+", 2);
        String firstName = parts[0];
        String lastName = parts.length > 1 ? parts[1] : "Cliente";
        return ensureClient(firstName, lastName, "DNI", "TEL-" + digits(phone), digits(phone), "");
    }

    private String resolveBranchId(String nameOrId) {
        if (nameOrId == null || nameOrId.isBlank()) return null;
        String id = findId("SELECT idBranch FROM tbranch WHERE idBranch=?", nameOrId);
        if (id != null) return id;
        id = findId("SELECT idBranch FROM tbranch WHERE LOWER(name)=LOWER(?)", nameOrId);
        if (id != null) return id;
        return findId("SELECT idBranch FROM tbranch WHERE LOWER(name) LIKE LOWER(?) LIMIT 1", "%" + nameOrId.replace(" - ", "%") + "%");
    }

    private List<String> resolveBranchIds(String branchName) {
        if (branchName == null || branchName.isBlank() || branchName.equalsIgnoreCase("Todas las sucursales")) {
            return jdbc.queryForList("SELECT idBranch FROM tbranch WHERE status='ACTIVA' ORDER BY name", String.class);
        }
        String id = resolveBranchId(branchName);
        return id == null ? List.of() : List.of(id);
    }

    private String resolveTableId(String branchId, String tableName, int guests) {
        String number = tableName == null ? "" : tableName.replaceAll("(?i)mesa", "").trim();
        String id = number.isBlank() ? null : findId("SELECT idRestaurantTable FROM trestauranttable WHERE idBranch=? AND tableNumber=?", branchId, number);
        if (id != null) return id;
        List<String> ids = jdbc.queryForList("SELECT idRestaurantTable FROM trestauranttable WHERE idBranch=? AND capacity>=? ORDER BY capacity,tableNumber LIMIT 1", String.class, branchId, guests);
        return ids.isEmpty() ? null : ids.getFirst();
    }

    private String findAvailableTable(String branchId, Date date, Time time, int people) {
        List<String> ids = jdbc.queryForList("""
            SELECT rt.idRestaurantTable FROM trestauranttable rt
             WHERE rt.idBranch=? AND rt.status='DISPONIBLE' AND rt.capacity>=?
               AND NOT EXISTS (SELECT 1 FROM treservation r WHERE r.idRestaurantTable=rt.idRestaurantTable
                   AND r.reservationDate=? AND r.reservationTime=?
                   AND r.status IN ('PENDIENTE','CONFIRMADA','REPROGRAMADA'))
             ORDER BY rt.capacity,rt.tableNumber LIMIT 1
            """, String.class, branchId, people, date, time);
        return ids.isEmpty() ? null : ids.getFirst();
    }

    private String resolvePaymentMethodId(String name) {
        if (name == null || name.isBlank()) return findId("SELECT idPaymentMethod FROM tpaymentmethod WHERE code='EFECTIVO'");
        String normalized = name.toUpperCase().replace(" ", "_");
        if (normalized.equals("TARJETA")) normalized = "TARJETA_BCP";
        String id = findId("SELECT idPaymentMethod FROM tpaymentmethod WHERE code=?", normalized);
        if (id == null) id = findId("SELECT idPaymentMethod FROM tpaymentmethod WHERE LOWER(name)=LOWER(?)", name);
        return id;
    }

    private String findId(String sql, Object... args) {
        List<String> ids = jdbc.query(sql, (rs, n) -> rs.getString(1), args);
        return ids.isEmpty() ? null : ids.getFirst();
    }

    private int nextSequence(String table, String codeColumn) {
        String sql = "SELECT " + codeColumn + " FROM " + table + " WHERE " + codeColumn + " IS NOT NULL";
        int max = 0;
        for (String code : jdbc.queryForList(sql, String.class)) max = Math.max(max, numericCode(code, 0));
        return max + 1;
    }

    private String nextReservationCode() {
        int sequence = nextSequence("treservation", "reservationCode");
        return "RES-" + LocalDate.now().getYear() + "-" + String.format("%04d", sequence);
    }

    private String nextOrderCode() {
        int sequence = nextSequence("torder", "orderCode");
        return "PED-" + LocalDate.now().getYear() + "-" + String.format("%04d", sequence);
    }

    private List<Map<String, Object>> trackingSteps(String status, String type) {
        List<String> order = "RECOJO".equals(type)
            ? List.of("CONFIRMADO", "EN_PREPARACION", "LISTO", "ENTREGADO")
            : List.of("CONFIRMADO", "EN_PREPARACION", "EN_CAMINO", "ENTREGADO");
        List<Map<String, Object>> steps = new ArrayList<>();
        int current = order.indexOf(status);
        if (status.equals("PENDIENTE")) current = -1;
        if (status.equals("CANCELADO")) current = -1;
        for (int i = 0; i < order.size(); i++) {
            String step = order.get(i);
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("title", trackingStatus(step, type));
            map.put("description", trackingDescription(step, type));
            map.put("icon", trackingIcon(step, type));
            map.put("completed", i < current || status.equals("ENTREGADO"));
            map.put("active", i == current || (status.equals("ENTREGADO") && i == order.size() - 1));
            steps.add(map);
        }
        return steps;
    }

    private String trackingStatus(String status, String type) {
        return switch (status) {
            case "PENDIENTE" -> "Pedido pendiente";
            case "CONFIRMADO" -> "Pedido confirmado";
            case "EN_PREPARACION" -> "En preparación";
            case "LISTO" -> "Listo para recoger";
            case "EN_CAMINO" -> "En camino";
            case "ENTREGADO" -> "Entregado";
            case "CANCELADO" -> "Cancelado";
            default -> "RECOJO".equals(type) ? "Listo para recoger" : "En preparación";
        };
    }

    private String trackingIcon(String status, String type) {
        return switch (status) {
            case "EN_PREPARACION" -> "soup_kitchen";
            case "LISTO" -> "takeout_dining";
            case "EN_CAMINO" -> "delivery_dining";
            case "ENTREGADO" -> "check_circle";
            case "CANCELADO" -> "cancel";
            default -> "receipt_long";
        };
    }

    private String trackingDescription(String status, String type) {
        return switch (status) {
            case "CONFIRMADO" -> "El restaurante recibió correctamente tu pedido.";
            case "EN_PREPARACION" -> "Tus platos están siendo preparados por nuestro equipo.";
            case "LISTO" -> "Puedes acercarte a la sucursal seleccionada.";
            case "EN_CAMINO" -> "El repartidor se dirige hacia tu ubicación.";
            case "ENTREGADO" -> "El pedido fue entregado correctamente.";
            default -> "Estado del pedido actualizado.";
        };
    }

    private String trackingColor(String status) {
        if (status.equals("ENTREGADO")) return "green";
        if (status.equals("LISTO") || status.equals("EN_PREPARACION")) return "orange";
        return "blue";
    }

    private String branchStatusUi(String value) {
        return switch (value) { case "INACTIVA" -> "Inactiva"; case "EN_MANTENIMIENTO" -> "En mantenimiento"; default -> "Activa"; };
    }
    private String branchStatusDb(String value) {
        if (value.equalsIgnoreCase("Inactiva")) return "INACTIVA";
        if (value.toLowerCase().contains("mantenimiento")) return "EN_MANTENIMIENTO";
        return "ACTIVA";
    }
    private String productStatusUi(String value) {
        return switch (value) { case "AGOTADO" -> "Agotado"; case "INACTIVO" -> "Inactivo"; default -> "Activo"; };
    }
    private String productStatusDb(String value) {
        if (value.equalsIgnoreCase("Agotado")) return "AGOTADO";
        if (value.equalsIgnoreCase("Inactivo")) return "INACTIVO";
        return "ACTIVO";
    }
    private String clientStatusUi(String value) {
        return switch (value) { case "INACTIVO" -> "Inactivo"; case "BLOQUEADO" -> "Bloqueado"; default -> "Activo"; };
    }
    private String clientStatusDb(String value) {
        if (value.equalsIgnoreCase("Inactivo")) return "INACTIVO";
        if (value.equalsIgnoreCase("Bloqueado")) return "BLOQUEADO";
        return "ACTIVO";
    }
    private String reservationStatusUi(String value) {
        return switch (value) { case "CONFIRMADA" -> "Confirmada"; case "REPROGRAMADA" -> "Reprogramada"; case "ATENDIDA" -> "Atendida"; case "CANCELADA" -> "Cancelada"; default -> "Pendiente"; };
    }
    private String reservationStatusDb(String value) {
        return switch (value.toLowerCase()) { case "confirmada" -> "CONFIRMADA"; case "reprogramada" -> "REPROGRAMADA"; case "atendida" -> "ATENDIDA"; case "cancelada" -> "CANCELADA"; default -> "PENDIENTE"; };
    }
    private String orderStatusUi(String value) {
        return switch (value) { case "CONFIRMADO" -> "Confirmado"; case "EN_PREPARACION" -> "En preparación"; case "LISTO" -> "Listo"; case "EN_CAMINO" -> "En camino"; case "ENTREGADO" -> "Entregado"; case "CANCELADO" -> "Cancelado"; default -> "Pendiente"; };
    }
    private String orderStatusDb(String value) {
        String v = value.toLowerCase();
        if (v.equals("confirmado")) return "CONFIRMADO";
        if (v.contains("preparación") || v.contains("preparacion")) return "EN_PREPARACION";
        if (v.equals("listo")) return "LISTO";
        if (v.contains("camino")) return "EN_CAMINO";
        if (v.equals("entregado")) return "ENTREGADO";
        if (v.equals("cancelado")) return "CANCELADO";
        return "PENDIENTE";
    }
    private String paymentUi(String value) {
        String v = value.toUpperCase();
        if (v.contains("YAPE")) return "Yape";
        if (v.contains("TARJETA")) return "Tarjeta BCP";
        return "Efectivo";
    }

    private String dateLabel(String isoDate) {
        try { return LocalDate.parse(isoDate).format(DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", new Locale("es","PE"))); }
        catch (Exception ex) { return isoDate; }
    }
    private String dateTimeUi(Object value) {
        if (value == null) return "";
        LocalDateTime dt;
        if (value instanceof Timestamp ts) dt = ts.toLocalDateTime();
        else if (value instanceof LocalDateTime ldt) dt = ldt;
        else { try { dt = LocalDateTime.parse(value.toString(), DATE_TIME_DB); } catch (Exception ex) { return value.toString(); } }
        return dt.format(DATE_TIME_UI).replace("a. m.", "a. m.").replace("p. m.", "p. m.");
    }
    private String timeUi(Object value) {
        if (value == null) return "";
        LocalDateTime dt = value instanceof Timestamp ts ? ts.toLocalDateTime() : LocalDateTime.now();
        return dt.format(TIME_UI);
    }
    private String sqlDateString(Object value) {
        if (value == null) return "";
        if (value instanceof Date date) return date.toLocalDate().toString();
        if (value instanceof LocalDate date) return date.toString();
        String s = value.toString();
        return s.length() >= 10 ? s.substring(0,10) : s;
    }
    private String sqlTimeString(Object value) {
        if (value == null) return "";
        if (value instanceof Time time) return time.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"));
        String s = value.toString();
        return s.length() >= 5 ? s.substring(0,5) : s;
    }
    private Date sqlDate(String value) {
        try { return value == null || value.isBlank() ? null : Date.valueOf(value.substring(0,10)); }
        catch (Exception ex) { return null; }
    }
    private Time sqlTime(String value) {
        try {
            if (value == null || value.isBlank()) return null;
            String normalized = value.trim();
            if (normalized.matches("\\d{2}:\\d{2}")) normalized += ":00";
            return Time.valueOf(normalized);
        } catch (Exception ex) { return null; }
    }
    private Timestamp timestamp(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp timestamp) return timestamp;
        if (value instanceof LocalDateTime dateTime) return Timestamp.valueOf(dateTime);
        String text = value.toString().trim();
        if (text.isBlank()) return null;
        try {
            String normalized = text.replace('T', ' ');
            if (normalized.length() == 16) normalized += ":00";
            return Timestamp.valueOf(normalized);
        } catch (Exception ex) {
            return null;
        }
    }

    private String openingHours(String opening, String closing) {
        if (opening == null || opening.isBlank() || closing == null || closing.isBlank()) return "Horario por confirmar";
        return "Lunes a domingo: " + opening + " - " + closing;
    }
    private int numericCode(String code, int fallback) {
        if (code == null) return fallback;
        String digits = code.replaceAll("\\D", "");
        try { return digits.isBlank() ? fallback : Integer.parseInt(digits); }
        catch (NumberFormatException ex) { return fallback; }
    }
    private String joinNonBlank(String a, String b) {
        if (a.isBlank()) return b;
        if (b.isBlank()) return a;
        return a + ", " + b;
    }
    private String string(Object value) { return value == null ? "" : value.toString(); }
    private String trim(Object value) { return string(value).trim(); }
    private String nullable(Object value) { String s = trim(value); return s.isBlank() ? null : s; }
    private String defaultIfBlank(String value, String fallback) { return value == null || value.isBlank() ? fallback : value; }
    private int integer(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try { return new BigDecimal(value.toString()).intValue(); } catch (Exception ex) { return 0; }
    }
    private BigDecimal decimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(value.toString()); } catch (Exception ex) { return BigDecimal.ZERO; }
    }
    private BigDecimal nullableDecimal(Object value) { return value == null ? null : decimal(value); }
    private boolean bool(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean b) return b;
        if (value instanceof Number n) return n.intValue() != 0;
        return List.of("true","1","yes","si","sí").contains(value.toString().toLowerCase());
    }
    private String digits(String value) { return value == null ? "" : value.replaceAll("\\D", ""); }
    private <T> List<T> safeList(List<T> list) { return list == null ? List.of() : list; }
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castMapList(List<?> list) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object value : list) if (value instanceof Map<?,?> map) result.add((Map<String,Object>) map);
        return result;
    }
}
