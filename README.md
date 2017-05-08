# Visualizador de imágenes

Aplicación web para visualizar una distribución 2D de propiedades de imágenes. Por ejemplo, para visualizar resultados de clasificadores de alta dimensionalidad usando t-SNE.

![Screenshot](https://github.com/fcortes/tsne-image-web-visualizer/raw/master/screenshot.png "Screenshot")


# Uso
Para acceder a la intefaz y no tener problemas con distintos navegadores, es conveniente montar un servidor local de archivos en el directorio de este repositorio. Por ejemplo, con python

  $ python3 -m http.server 8088

La aplicación lee el archivo `data.csv` que debe contener las columnas `id`, `x`, `y`, `class`, `file` y `thumbnail`, que se detallan a continuación.


| Atributo    | Descripción                                              | Ejemplo               |
|:-----------:|:---------------------------------------------------------|:-----------------------|
| id          | Número de identificación.                                | 1                     |
| x           | Posición x de la imagen. Debe ser un número entre 0 y 1  | 0.5                   |
| y           | Posición y de la imagen. Debe ser un número entre 0 y 1  | 0.5                   |
| file        | Dirección a la imagen correspondiente.                   | img/imagen0.png       |
| thumbnail   | Dirección a la versión miniaturizada de la imagen        | img/thumb/imagen0.png |
