# Azure secondary deployment setup

The repository now expects GitHub environments and OIDC configuration that
cannot be created safely from a source checkout. Complete these steps before
relying on the new workflows.

## Recover and verify access

Reauthenticate the local CLI without rotating working GitHub credentials:

```sh
az logout
az login --tenant 5d7b49e9-50d2-40dc-bab1-14a2d903542c
az account show --subscription 4a5b0ca8-2a36-4c44-90e9-079ff3d6178d
```

Confirm the subscription is enabled, the VM is running, and the public IP
matches the existing `AZURE_VM_IP` value. Compare the VM authorized-key
fingerprint with `~/.ssh/aidan_azure.pub`; rotate that key only if it differs
or is compromised. Obtain the VM SSH host key via Azure's authenticated
console/channel, then set `AZURE_SSH_KNOWN_HOSTS` to its known-hosts entry.
Do not populate it with an unauthenticated `ssh-keyscan` result.

## GitHub environments and branch protection

Create `production-azure`, `production-k8s`, and `production-azure-infra`
environments. Restrict each environment to deployments from `main`; require an
approver for `production-azure-infra`. Move Azure deployment secrets into
`production-azure` and Kubernetes deployment secrets into `production-k8s`
only after their consuming workflows have been migrated. The Azure environment
needs `AZURE_VM_IP`, `AZURE_SSH_PRIVATE_KEY`, `AZURE_SSH_KNOWN_HOSTS`, and its
application secrets.

Create a `main` ruleset that requires a pull request, one non-stale approval,
resolved conversations, and these checks:

```text
CI / build-images
Lint & Format / lint-gate
Terraform / terraform-gate
```

Also disable force-pushes and branch deletion. GitHub rulesets and environment
reviewers are account-level controls, so they cannot be represented in a file
in this repository.

## Terraform state and identities

Follow [the import guide](../../infra/terraform/IMPORT.md) to bootstrap the
state backend, create the read-only plan and protected apply OIDC identities,
import the existing resources, and prove a zero-change plan before allowing an
apply. The `Terraform` workflow uses GitHub OIDC only; it does not accept an
Azure client secret.

Use `CD — Azure VM` on pushes to `main` for automatic mirroring. Its manual
dispatch requires a full SHA reachable from `main`, builds images tagged with
that exact SHA, and serializes deployments without cancelling an active one.
