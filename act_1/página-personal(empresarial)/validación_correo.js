
document.getElementById('tuFormulario').addEventListener('submit', function(event) {
  const emailInput = document.getElementById('correoEmpresa');
  const emailValue = emailInput.value;
  const regex = /.+@miempresa\.com$/;

  if (!regex.test(emailValue)) {
    alert('El formato del correo no es válido para la empresa.');
    event.preventDefault(); // Evita el envío del formulario
  }
});
