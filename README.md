# Запросы на выборку данных

| Параметр | тип | Оказываемое действие |
| ------ | ------ | ------ |
| limit | number | Ограничение количества элементов в выборке |
| skip | number | Количество отброшенных значений |
| query | IQuery | параметры выборки |

## IQuery
| Параметр | тип | Оказываемое действие |
| ------ | ------ | ------ |
| $or | string | поиск элементов которые содеражат указанное значение |
| <имя_поля> | <any> | поиск элементов с определенным значением поля |

## Сортировка
Любой GET запрос на получение данных принимает параметр `sort` со значениями поля по которому необходимо проводить сортировку, значения передаются через запятую.

| Значение поля `sort` | Результат сортировки |
| ------ | ------ |
| name | Сортировка по возврастанию по полю `name` |
| -name | Сортировка по убыванию по полю `name` |
| -name,price | Сортировка по убыванию по полю `name` с последующей сортировкой по полю `price` |

