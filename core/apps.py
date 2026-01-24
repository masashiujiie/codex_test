from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"  # モデルの主キーに使うデフォルトフィールド
    name = "core"  # アプリ名（settings.INSTALLED_APPSで参照）
