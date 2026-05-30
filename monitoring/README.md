# DocuThinker Monitoring Stack

Complete monitoring, logging, and alerting solution for DocuThinker application.

## Components

### 1. Prometheus
- **Purpose**: Metrics collection and alerting
- **Port**: 9090
- **Features**:
  - Application metrics collection
  - Infrastructure monitoring
  - Custom alert rules
  - 30-day retention

### 2. Grafana
- **Purpose**: Metrics visualization
- **Port**: 3000
- **Features**:
  - Pre-configured dashboards
  - Real-time monitoring
  - Alert visualization
  - Custom dashboard support

### 3. ELK Stack
- **Elasticsearch**: Log storage and search
- **Logstash**: Log processing and transformation
- **Kibana**: Log visualization and analysis

### 4. AlertManager
- **Purpose**: Alert routing and notification
- **Features**:
  - Slack integration
  - PagerDuty integration
  - Alert grouping and deduplication

## Installation

### Prerequisites
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add elastic https://helm.elastic.co
helm repo update
```

### Install Prometheus + Grafana
```bash
kubectl create namespace monitoring

helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values monitoring/prometheus/values.yaml
```

### Install Alert Rules
```bash
kubectl apply -f monitoring/prometheus/alert-rules.yaml
```

### Install ELK Stack

#### 1. Create Elasticsearch credentials
```bash
kubectl create secret generic elasticsearch-credentials \
  --namespace monitoring \
  --from-literal=username=elastic \
  --from-literal=password=YOUR_SECURE_PASSWORD
```

#### 2. Install Elasticsearch
```bash
helm install elasticsearch elastic/elasticsearch \
  --namespace monitoring \
  --values monitoring/elk/elasticsearch-values.yaml
```

#### 3. Install Logstash
```bash
helm install logstash elastic/logstash \
  --namespace monitoring \
  --values monitoring/elk/logstash-values.yaml
```

#### 4. Install Kibana
```bash
helm install kibana elastic/kibana \
  --namespace monitoring \
  --values monitoring/elk/kibana-values.yaml
```

## Accessing Services

### Prometheus
```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
# Access at: http://localhost:9090
```

### Grafana
```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
# Access at: http://localhost:3000
# Default credentials: admin / prom-operator
```

### Kibana
```bash
kubectl port-forward -n monitoring svc/kibana-kibana 5601:5601
# Access at: http://localhost:5601
```

## Dashboards

### Grafana Dashboards
Pre-configured dashboards available:
1. **DocuThinker Overview**: Application-specific metrics
2. **Kubernetes Cluster**: Cluster health and performance
3. **Node Exporter**: Node-level metrics

### Custom Metrics

Add custom metrics to your application:

#### Backend (Node.js)
```javascript
const prometheus = require('prom-client');

// Request counter
const httpRequestCounter = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Response time histogram
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

## Alert Configuration

### Modifying Alerts

Edit `monitoring/prometheus/alert-rules.yaml` to add or modify alerts:

```yaml
- alert: CustomAlert
  expr: your_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Alert description"
    description: "Detailed alert information"
```

Apply changes:
```bash
kubectl apply -f monitoring/prometheus/alert-rules.yaml
```

### Alert Receivers

Configure receivers in `monitoring/prometheus/values.yaml`:

```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - channel: '#alerts'
        api_url: 'YOUR_SLACK_WEBHOOK'
```

## Log Management

### Viewing Logs in Kibana

1. Access Kibana at http://kibana.docuthinker.com
2. Create index pattern: `docuthinker-*`
3. Use Discover to search logs
4. Create visualizations and dashboards

### Log Levels

Application logs are categorized:
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions
- **INFO**: Informational messages
- **DEBUG**: Debug-level messages

### Searching Logs

Example Kibana queries:
```
# Find all errors
log_level: "ERROR"

# Find errors in specific pod
pod_name: "backend-*" AND log_level: "ERROR"

# Find slow requests
http.response_time: >1000

# Find logs in time range
@timestamp: [now-1h TO now]
```

## Performance Optimization

### Prometheus
- Retention: 30 days (configurable)
- Storage: 100Gi (auto-scaling enabled)
- Scrape interval: 30s

### Elasticsearch
- 3 replicas for high availability
- 100Gi storage per node
- Index lifecycle management enabled

## Troubleshooting

### Prometheus not scraping targets
```bash
kubectl logs -n monitoring -l app=prometheus
```

### Grafana dashboards not loading
```bash
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana
```

### Elasticsearch cluster health
```bash
kubectl exec -n monitoring elasticsearch-master-0 -- curl -u elastic:$PASSWORD http://localhost:9200/_cluster/health?pretty
```

## Cost Optimization

1. **Adjust retention periods** based on compliance requirements
2. **Use lifecycle policies** in Elasticsearch to move old data to cheaper storage
3. **Scale down replicas** in non-production environments
4. **Use spot instances** for log processing nodes

## Security

- All services use TLS encryption
- RBAC enabled for Kubernetes access
- Secrets stored in Kubernetes Secrets
- Network policies restrict pod-to-pod communication

## Maintenance

### Backup Elasticsearch Indices
```bash
kubectl exec -n monitoring elasticsearch-master-0 -- \
  curl -X PUT "localhost:9200/_snapshot/backup" \
  -H 'Content-Type: application/json' \
  -d '{"type": "s3", "settings": {"bucket": "docuthinker-logs-backup"}}'
```

### Update Dashboards
```bash
# Export dashboard from Grafana UI
# Import to monitoring/grafana/dashboards/
kubectl apply -f monitoring/grafana/dashboards/
```

## Support

For issues or questions about monitoring:
1. Check logs of respective components
2. Review Prometheus targets page
3. Verify network connectivity
4. Check resource utilization

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elastic Stack Documentation](https://www.elastic.co/guide/index.html)
