from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("listings", "0006_subscription"),
    ]

    operations = [
        migrations.AddField(
            model_name="car",
            name="is_vip",
            field=models.BooleanField(default=False),
        ),
    ]
