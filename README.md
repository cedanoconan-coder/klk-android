
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>klk</title>
<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #e9f5ef;
}
header {
  background: #075e54;
  color: white;
  padding: 22px;
  font-size: 28px;
  font-weight: bold;
}
.subtitle {
  color: #d8f5e9;
  font-size: 13px;
}
.search {
  padding: 15px;
}
input {
  width: 90%;
  padding: 13px;
  border: 0;
  border-radius: 20px;
}
.contact {
  background: white;
  padding: 18px;
  border-bottom: 1px solid #ddd;
  display: flex;
  gap: 15px;
  align-items: center;
}
.avatar {
  background: #128c7e;
  color: white;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  font-size: 20px;
}
.welcome {
  padding: 20px;
  text-align: center;
}
button {
  background: #128c7e;
  color: white;
  border: 0;
  padding: 13px 22px;
  border-radius: 25px;
}
</style>
</head>
<body>
<header>
  klk
  <div class="subtitle">Familia siempre unida ❤️</div>
</header>

<div class="search">
  <input placeholder="Buscar familiares...">
</div>

<div class="welcome">
  <h2>¡Bienvenido a klk!</h2>
  <p>Tu familia, siempre conectada.</p>
  <button onclick="alert('Próximamente podrás invitar a tu familia')">
    Invitar familiares
  </button>
</div>

<div class="contact">
  <div class="avatar">F</div>
  <div><b>Familia</b><br>Bienvenidos a klk ❤️</div>
</div>

<div class="contact">
  <div class="avatar">👨</div>
  <div><b>Mis familiares</b><br>Conectados contigo</div>
</div>

</body>
</html>
