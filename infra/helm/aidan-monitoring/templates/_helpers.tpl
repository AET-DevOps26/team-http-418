{{/*
Expand the name of the chart.
*/}}
{{- define "aidan-monitoring.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "aidan-monitoring.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Fully-qualified service DNS name in the application namespace.
*/}}
{{- define "aidan-monitoring.appService" -}}
{{- printf "%s.%s.svc.cluster.local" .service .namespace }}
{{- end }}
