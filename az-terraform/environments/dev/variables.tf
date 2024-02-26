variable "environmentPrefix" {
  type = string
  description = "A prefix used for naming resources to ensure uniqueness"
  default = "dev" # Default value; can be overridden
}
