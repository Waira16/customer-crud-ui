# DevOps Gorev Plani - Telecom CRM

## 1. ASAMA - Kubernetes (TAMAMLANDI)

- [x] minikube start
- [x] Dockerfile (backend + frontend)
- [x] k8s manifest dosyalari (`kubectl apply -f k8s/`)
- [x] Self-healing: `kubectl delete pod <backend-pod>`
- [x] Scaling: `kubectl scale deployment backend --replicas=5`
- [x] Erisim: `kubectl port-forward svc/frontend 8088:80`

## 2. ASAMA - CI/CD Pipeline (TAMAMLANDI)

GitHub Actions dosyalari:
- `customer-crud-api/.github/workflows/deploy.yml`
- `customer-crud-ui/.github/workflows/deploy.yml`

### Akis (push)
1. Unit test (backend) / build (frontend)
2. Docker imaji olustur
3. **GitHub Container Registry (ghcr.io)** push

### Imajlar
- `ghcr.io/waira16/telecom-backend:latest`
- `ghcr.io/waira16/telecom-frontend:latest`

GitHub -> Profil -> **Packages**

## 3. ASAMA - Observability (TAMAMLANDI)

Detayli komutlar: `k8s/OBSERVABILITY.md`

### Dashboard (gorsel panel)

```powershell
minikube dashboard
```

Pod durumu, CPU, RAM, loglar.

### Metrics (CPU/RAM)

```powershell
kubectl top nodes
kubectl top pods
```

### Canli log takibi

```powershell
kubectl logs -f deployment/backend
kubectl logs -f deployment/frontend
kubectl logs -f deployment/postgres
```

### Hata analizi

```powershell
kubectl describe pod <pod-adı>
kubectl logs <pod-adı> --previous
kubectl get events --sort-by=.metadata.creationTimestamp
```

## Hizli komutlar

```powershell
kubectl get pods -A
kubectl get svc
kubectl port-forward svc/frontend 8088:80
minikube status
minikube dashboard
```

## Gorev Ozeti

| Asama | Konu | Durum |
|-------|------|-------|
| 1 | K8s deploy, self-healing, scaling | Tamam |
| 2 | CI/CD GitHub Actions + Docker push | Tamam |
| 3 | Dashboard, logs, CPU/RAM izleme | Tamam |
