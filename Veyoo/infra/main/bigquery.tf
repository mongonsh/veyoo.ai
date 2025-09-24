resource "google_bigquery_dataset" "career_simulations" {
  dataset_id = "career_simulations"
  location   = "US"
}