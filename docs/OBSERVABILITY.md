# Observability - 3. Asama

PowerShell komutlari (IdeaProjects/k8s klasorunden veya her yerden calisir).

## 1) Genel durum

```powershell
kubectl get pods -o wide
kubectl get svc
kubectl get deployments
```

## 2) CPU / RAM (metrics-server)

```powershell
kubectl top nodes
kubectl top pods
kubectl top pods -l app=backend
```

> "Metrics API not available" gorursen 1-2 dk bekle veya:
> `minikube addons enable metrics-server`

## 3) Gorsel panel (Dashboard)

Ayri bir terminal ac (kapatma):

```powershell
minikube dashboard
```

Tarayicida acilir: Pod listesi, CPU/RAM grafikleri, loglar, eventler.

Alternatif URL:

```powershell
minikube service list
```

## 4) Canli log takibi

```powershell
# Backend (Ctrl+C ile cik)
kubectl logs -f deployment/backend

# Frontend
kubectl logs -f deployment/frontend

# Postgres
kubectl logs -f deployment/postgres
```

Belirli pod:

```powershell
kubectl get pods -l app=backend
kubectl logs -f backend-XXXXX-YYYYY
```

## 5) Hata analizi (Pod crash / Error)

```powershell
kubectl get pods
kubectl describe pod <pod-adı>
kubectl logs <pod-adı>
kubectl logs <pod-adı> --previous
kubectl get events --sort-by=.metadata.creationTimestamp
```

Ornek yorum:
- `CrashLoopBackOff` -> logs + describe ile sebep (DB baglantisi, OOM, vb.)
- `ImagePullBackOff` -> imaj adi veya registry hatasi
- `Pending` -> kaynak veya PVC sorunu

## 6) Self-healing testi (tekrar)

```powershell
kubectl get pods -l app=backend
kubectl delete pod <bir-backend-pod-adı>
kubectl get pods -l app=backend -w
```

## 7) Scaling testi

```powershell
kubectl scale deployment backend --replicas=5
kubectl get pods -l app=backend
kubectl top pods -l app=backend
kubectl scale deployment backend --replicas=2
```

## 8) Uygulamaya erisim

```powershell
kubectl port-forward svc/frontend 8088:80
```

Tarayici: http://localhost:8088

## CI/CD imajlari (GitHub Packages)

Pipeline basariliysa imajlar:
- ghcr.io/waira16/telecom-backend:latest
- ghcr.io/waira16/telecom-frontend:latest

GitHub -> Profil -> Packages
