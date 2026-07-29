package com.saborandino.api.frontend;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/frontend")
public class FrontendDataController {

    private final FrontendDataService service;

    public FrontendDataController(FrontendDataService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public FrontendApiResponse<Map<String, Object>> health() {
        try {
            return FrontendApiResponse.ok("Backend y base de datos conectados.", service.health());
        } catch (Exception ex) {
            return FrontendApiResponse.fail("El backend está activo, pero la base de datos no está preparada: " + ex.getMessage());
        }
    }

    @GetMapping("/public/branches")
    public FrontendApiResponse<List<Map<String, Object>>> publicBranches() {
        return FrontendApiResponse.ok("Sucursales obtenidas.", service.getBranches(true));
    }

    @GetMapping("/public/categories")
    public FrontendApiResponse<List<Map<String, Object>>> publicCategories() {
        return FrontendApiResponse.ok("Categorías obtenidas.", service.getCategories(true));
    }

    @GetMapping("/public/products")
    public FrontendApiResponse<List<Map<String, Object>>> publicProducts() {
        return FrontendApiResponse.ok("Productos obtenidos.", service.getProducts(true));
    }

    @GetMapping("/public/promotion")
    public FrontendApiResponse<Map<String, Object>> publicPromotion() {
        Map<String, Object> promotion = service.getActivePromotion();
        return promotion == null
            ? FrontendApiResponse.ok("No hay una promoción activa.", null)
            : FrontendApiResponse.ok("Promoción activa obtenida.", promotion);
    }

    @GetMapping("/public/tables/available")
    public FrontendApiResponse<List<Map<String, Object>>> availableTables(
        @RequestParam String branchId,
        @RequestParam String date,
        @RequestParam String time,
        @RequestParam int people
    ) {
        return FrontendApiResponse.ok("Mesas disponibles obtenidas.", service.availableTables(branchId, date, time, people));
    }

    @PostMapping("/public/reservations")
    public ResponseEntity<FrontendApiResponse<Map<String, Object>>> createReservation(@RequestBody Map<String, Object> request) {
        try {
            return ResponseEntity.ok(FrontendApiResponse.ok(
                "Reserva registrada correctamente.", service.createPublicReservation(request)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.ok(FrontendApiResponse.fail(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.ok(FrontendApiResponse.fail("No se pudo registrar la reserva: " + ex.getMessage()));
        }
    }

    @PostMapping("/public/orders")
    public ResponseEntity<FrontendApiResponse<Map<String, Object>>> createOrder(@RequestBody Map<String, Object> request) {
        try {
            return ResponseEntity.ok(FrontendApiResponse.ok(
                "Pedido registrado correctamente.", service.createPublicOrder(request)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.ok(FrontendApiResponse.fail(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.ok(FrontendApiResponse.fail("No se pudo registrar el pedido: " + ex.getMessage()));
        }
    }

    @GetMapping("/public/orders/track")
    public FrontendApiResponse<Map<String, Object>> trackOrder(@RequestParam String code, @RequestParam String phone) {
        Map<String, Object> order = service.trackOrder(code, phone);
        return order == null
            ? FrontendApiResponse.fail("No encontramos un pedido con esos datos.")
            : FrontendApiResponse.ok("Pedido encontrado.", order);
    }

    @GetMapping("/admin/branches")
    public FrontendApiResponse<List<Map<String, Object>>> branches() {
        return FrontendApiResponse.ok("Sucursales obtenidas.", service.getBranches(false));
    }

    @PutMapping("/admin/branches/sync")
    public FrontendApiResponse<Void> syncBranches(@RequestBody List<Map<String, Object>> request) {
        service.syncBranches(request);
        return FrontendApiResponse.ok("Sucursales guardadas en la base de datos.", null);
    }

    @DeleteMapping("/admin/branches/{code}")
    public FrontendApiResponse<Void> deleteBranch(@PathVariable String code) {
        return service.deleteBranch(code)
            ? FrontendApiResponse.ok("Sucursal eliminada.", null)
            : FrontendApiResponse.fail("La sucursal no se puede eliminar porque tiene registros relacionados.");
    }

    @GetMapping("/admin/categories")
    public FrontendApiResponse<List<Map<String, Object>>> categories() {
        return FrontendApiResponse.ok("Categorías obtenidas.", service.getCategories(false));
    }

    @PutMapping("/admin/categories/sync")
    public FrontendApiResponse<Void> syncCategories(@RequestBody List<Map<String, Object>> request) {
        service.syncCategories(request);
        return FrontendApiResponse.ok("Categorías guardadas en la base de datos.", null);
    }

    @DeleteMapping("/admin/categories/{code}")
    public FrontendApiResponse<Void> deleteCategory(@PathVariable String code) {
        return service.deleteCategory(code)
            ? FrontendApiResponse.ok("Categoría eliminada.", null)
            : FrontendApiResponse.fail("La categoría no se puede eliminar porque contiene productos.");
    }

    @GetMapping("/admin/products")
    public FrontendApiResponse<List<Map<String, Object>>> products() {
        return FrontendApiResponse.ok("Productos obtenidos.", service.getProducts(false));
    }

    @PutMapping("/admin/products/sync")
    public FrontendApiResponse<Void> syncProducts(@RequestBody List<Map<String, Object>> request) {
        service.syncProducts(request);
        return FrontendApiResponse.ok("Productos guardados en la base de datos.", null);
    }

    @DeleteMapping("/admin/products/{code}")
    public FrontendApiResponse<Void> deleteProduct(@PathVariable String code) {
        return service.deleteProduct(code)
            ? FrontendApiResponse.ok("Producto eliminado.", null)
            : FrontendApiResponse.fail("El producto no se puede eliminar porque aparece en pedidos registrados.");
    }

    @GetMapping("/admin/clients")
    public FrontendApiResponse<List<Map<String, Object>>> clients() {
        return FrontendApiResponse.ok("Clientes obtenidos.", service.getClients());
    }

    @PutMapping("/admin/clients/sync")
    public FrontendApiResponse<Void> syncClients(@RequestBody List<Map<String, Object>> request) {
        service.syncClients(request);
        return FrontendApiResponse.ok("Clientes guardados en la base de datos.", null);
    }

    @DeleteMapping("/admin/clients/{code}")
    public FrontendApiResponse<Void> deleteClient(@PathVariable String code) {
        return service.deleteClient(code)
            ? FrontendApiResponse.ok("Cliente eliminado.", null)
            : FrontendApiResponse.fail("El cliente no se puede eliminar porque tiene pedidos o reservas relacionados.");
    }

    @GetMapping("/admin/tables")
    public FrontendApiResponse<List<Map<String, Object>>> tables() {
        return FrontendApiResponse.ok("Mesas obtenidas.", service.getTables());
    }

    @PutMapping("/admin/tables/sync")
    public FrontendApiResponse<Void> syncTables(@RequestBody List<Map<String, Object>> request) {
        service.syncTables(request);
        return FrontendApiResponse.ok("Mesas guardadas en la base de datos.", null);
    }

    @DeleteMapping("/admin/tables/{id}")
    public FrontendApiResponse<Void> deleteTable(@PathVariable String id) {
        return service.deleteTable(id)
            ? FrontendApiResponse.ok("Mesa eliminada.", null)
            : FrontendApiResponse.fail("La mesa no se puede eliminar porque tiene reservas relacionadas.");
    }

    @GetMapping("/admin/promotions")
    public FrontendApiResponse<List<Map<String, Object>>> promotions() {
        return FrontendApiResponse.ok("Promociones obtenidas.", service.getPromotions());
    }

    @PutMapping("/admin/promotions/sync")
    public FrontendApiResponse<Void> syncPromotions(@RequestBody List<Map<String, Object>> request) {
        service.syncPromotions(request);
        return FrontendApiResponse.ok("Promociones guardadas en la base de datos.", null);
    }

    @DeleteMapping("/admin/promotions/{id}")
    public FrontendApiResponse<Void> deletePromotion(@PathVariable String id) {
        return service.deletePromotion(id)
            ? FrontendApiResponse.ok("Promoción eliminada.", null)
            : FrontendApiResponse.fail("La promoción no se pudo eliminar.");
    }

    @GetMapping("/admin/payments")
    public FrontendApiResponse<List<Map<String, Object>>> payments() {
        return FrontendApiResponse.ok("Pagos obtenidos.", service.getPayments());
    }

    @PutMapping("/admin/payments/sync")
    public FrontendApiResponse<Void> syncPayments(@RequestBody List<Map<String, Object>> request) {
        service.syncPayments(request);
        return FrontendApiResponse.ok("Pagos actualizados en la base de datos.", null);
    }

    @GetMapping("/admin/reservations")
    public FrontendApiResponse<List<Map<String, Object>>> reservations() {
        return FrontendApiResponse.ok("Reservas obtenidas.", service.getReservations());
    }

    @PutMapping("/admin/reservations/sync")
    public FrontendApiResponse<Void> syncReservations(@RequestBody List<Map<String, Object>> request) {
        service.syncReservations(request);
        return FrontendApiResponse.ok("Reservas guardadas en la base de datos.", null);
    }

    @GetMapping("/admin/orders")
    public FrontendApiResponse<List<Map<String, Object>>> orders() {
        return FrontendApiResponse.ok("Pedidos obtenidos.", service.getOrders());
    }

    @PutMapping("/admin/orders/sync")
    public FrontendApiResponse<Void> syncOrders(@RequestBody List<Map<String, Object>> request) {
        service.syncOrders(request);
        return FrontendApiResponse.ok("Pedidos guardados en la base de datos.", null);
    }

    @GetMapping("/admin/dashboard")
    public FrontendApiResponse<Map<String, Object>> dashboard() {
        return FrontendApiResponse.ok("Dashboard obtenido.", service.dashboard());
    }

    @GetMapping("/admin/reports")
    public FrontendApiResponse<Map<String, Object>> reports(
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to
    ) {
        return FrontendApiResponse.ok("Reporte obtenido.", service.reports(from, to));
    }
}
