# DocuThinker Kubernetes Rollouts

This directory now holds the production rollouts used by the Jenkins pipeline:

- `backend-*-deployment.yaml` / `frontend-*-deployment.yaml`: Blue and green deployments with a single-replica canary for each tier.
- `backend-service.yaml` / `frontend-service.yaml`: Stable services pointing to the active track (defaults to `blue`).
- `backend-canary-service.yaml` / `frontend-canary-service.yaml`: Canary traffic targets.
- `ingress.yaml`: NGINX ingress with header- and weight-based canary routing (`X-DocuThinker-Canary: always`, default weight `10%`).
- `configmap.yaml`: Shared non-secret environment values consumed by all pods.
- Update the hostnames in `ingress.yaml` (`docuthinker.example.com`, `api.docuthinker.example.com`) to match your DNS entries.

> `kubernetes/manifests/` is legacy. Use the files in this folder for blue/green + canary rollouts.

## How the release strategy works

1. Services point to the active color via the `track` selector (`blue` or `green`). Canary pods always sit behind the dedicated canary services.
2. The Jenkins pipeline:
   - Builds and pushes images to `$REGISTRY` tagged with `${GIT_SHA}-${BUILD_NUMBER}`.
   - Applies services/ingress/configmap and both color deployments, then scales the target color up (default 3 replicas).
   - Updates canary deployments to the new image and waits for readiness.
   - Requires a manual “Promote” input before patching services to the target color and scaling the previous color to `0`.
3. Canary traffic is controlled by the ingress annotations. Adjust the weight at runtime:

   ```bash
   kubectl -n <ns> annotate ingress docuthinker-canary-ingress \
     nginx.ingress.kubernetes.io/canary-weight="5" --overwrite
   ```

## Handy commands

- Get the currently active color:

  ```bash
  kubectl -n <ns> get svc backend-service -o jsonpath='{.spec.selector.track}'
  ```

- Promote manually without Jenkins:

  ```bash
  TARGET=green  # or blue
  kubectl -n <ns> scale deployment/backend-$TARGET --replicas=3
  kubectl -n <ns> scale deployment/frontend-$TARGET --replicas=3
  kubectl -n <ns> patch service backend-service -p "{\"spec\": {\"selector\": {\"app\": \"backend\", \"track\": \"$TARGET\"}}}"
  kubectl -n <ns> patch service frontend-service -p "{\"spec\": {\"selector\": {\"app\": \"frontend\", \"track\": \"$TARGET\"}}}"
  ```

- Roll back instantly:

  ```bash
  PREV=blue  # whichever color was live before
  kubectl -n <ns> patch service backend-service -p "{\"spec\": {\"selector\": {\"app\": \"backend\", \"track\": \"$PREV\"}}}"
  kubectl -n <ns> patch service frontend-service -p "{\"spec\": {\"selector\": {\"app\": \"frontend\", \"track\": \"$PREV\"}}}"
  kubectl -n <ns> scale deployment/backend-$PREV --replicas=3
  kubectl -n <ns> scale deployment/frontend-$PREV --replicas=3
  kubectl -n <ns> scale deployment/backend-$( [ "$PREV" = "blue" ] && echo green || echo blue ) --replicas=0
  kubectl -n <ns> scale deployment/frontend-$( [ "$PREV" = "blue" ] && echo green || echo blue ) --replicas=0
  ```

## Jenkins credential expectations

- `docuthinker-registry` (username/password) used for `docker login $REGISTRY_HOST`.
- `kubeconfig-docuthinker` (file credential) exported as `$KUBECONFIG` for rollout commands.
- Pipeline envs:
  - `REGISTRY` (e.g., `registry.example.com/docuthinker`)
  - `KUBE_CONTEXT`, `KUBE_NAMESPACE`
  - `CANARY_WEIGHT` for ingress weighting
