import type { FormEvent } from 'react';
import { useState } from 'react';
import { useAuth } from '@clerk/react-router';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Phone, Mail, ChevronRight, ChevronLeft } from 'lucide-react';

type Step = 1 | 2;

export function CreateCondominiumPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  const [formData, setFormData] = useState({
    name: '',
    razaoSocial: '',
    cnpj: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const isValidCNPJ = (value: string) => {
    const cnpj = value.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;
    if (!/^\d+$/.test(cnpj)) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;

    const calcDigit = (base: string, weights: number[]) => {
      let sum = 0;
      for (let i = 0; i < weights.length; i++) {
        sum += Number(base[i]) * weights[i];
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const d1 = calcDigit(cnpj.slice(0, 12), weights1);

    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const d2 = calcDigit(cnpj.slice(0, 13), weights2);

    return Number(cnpj[12]) === d1 && Number(cnpj[13]) === d2;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const validateStep1 = () => {
    return (
      formData.name &&
      formData.razaoSocial &&
      formData.cnpj &&
      isValidCNPJ(formData.cnpj) &&
      formData.email &&
      formData.phone
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setError(null);
    } else if (currentStep === 1) {
      if (formData.cnpj && !isValidCNPJ(formData.cnpj)) {
        setError('CNPJ inválido. Verifique os números e tente novamente.');
        return;
      }
      setError('Por favor, preencha todos os campos obrigatórios');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setError(null);
    }
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!isValidCNPJ(formData.cnpj)) {
        throw new Error('CNPJ inválido. Verifique os números e tente novamente.');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Você precisa estar autenticado para criar um condomínio.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/condominiums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''),
          address: {
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zipCode.replace(/\D/g, ''),
          },
          cnpjs: [
            {
              cnpj: formData.cnpj.replace(/\D/g, ''),
              razao_social: formData.razaoSocial,
              descricao: 'CNPJ principal',
              principal: true,
              ativo: true,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar condomínio');
      }

      navigate('/layout-14', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar condomínio');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 py-12 px-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/media/images/ap202_logo.png" 
              alt="AP202" 
              className="h-12"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo ao AP202!</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Vamos começar configurando o seu condomínio. Este processo é rápido e você poderá 
            gerenciar todas as informações do seu condomínio em um só lugar.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Stepper */}
          <div className="bg-gray-50 px-8 py-6">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <span className={`ml-3 text-sm font-medium ${
                  currentStep >= 1 ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  Informações Básicas
                </span>
              </div>

              <div className="w-16 h-0.5 bg-gray-300"></div>

              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <span className={`ml-3 text-sm font-medium ${
                  currentStep >= 2 ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  Endereço
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="px-8 py-8">
              {/* Step 1: Informações Básicas */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Passo 1: Informações do Condomínio
                    </h2>
                    <p className="text-sm text-gray-600">
                      Cadastre os dados principais do seu condomínio. Essas informações serão 
                      usadas para identificação oficial e comunicação com moradores.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                        Nome do Condomínio *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange('name')}
                        className="h-11"
                        required
                        placeholder="Ex: Residencial Jardim das Flores"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="razaoSocial" className="text-sm font-medium text-gray-700 mb-2 block">
                        Razão Social *
                      </Label>
                      <Input
                        id="razaoSocial"
                        type="text"
                        value={formData.razaoSocial}
                        onChange={handleChange('razaoSocial')}
                        className="h-11"
                        required
                        placeholder="Ex: Residencial Jardim das Flores LTDA"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cnpj" className="text-sm font-medium text-gray-700 mb-2 block">
                        CNPJ *
                      </Label>
                      <Input
                        id="cnpj"
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) => {
                          const formatted = formatCNPJ(e.target.value);
                          setFormData(prev => ({ ...prev, cnpj: formatted }));
                        }}
                        className="h-11"
                        required
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Telefone *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setFormData(prev => ({ ...prev, phone: formatted }));
                        }}
                        className="h-11"
                        required
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                        <Mail className="w-4 h-4 inline mr-1" />
                        E-mail Principal *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange('email')}
                        className="h-11"
                        required
                        placeholder="contato@condominio.com.br"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Endereço */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Passo 2: Localização do Condomínio
                    </h2>
                    <p className="text-sm text-gray-600">
                      Informe o endereço completo. Isso ajudará na localização geográfica e 
                      facilitará o cadastro de prestadores de serviço e entregas.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700 mb-2 block">
                        CEP *
                      </Label>
                      <Input
                        id="zipCode"
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => {
                          const formatted = formatZipCode(e.target.value);
                          setFormData(prev => ({ ...prev, zipCode: formatted }));
                        }}
                        className="h-11"
                        required
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="street" className="text-sm font-medium text-gray-700 mb-2 block">
                        Rua/Avenida *
                      </Label>
                      <Input
                        id="street"
                        type="text"
                        value={formData.street}
                        onChange={handleChange('street')}
                        className="h-11"
                        required
                        placeholder="Ex: Rua das Flores"
                      />
                    </div>

                    <div>
                      <Label htmlFor="number" className="text-sm font-medium text-gray-700 mb-2 block">
                        Número *
                      </Label>
                      <Input
                        id="number"
                        type="text"
                        value={formData.number}
                        onChange={handleChange('number')}
                        className="h-11"
                        required
                        placeholder="Ex: 123"
                      />
                    </div>

                    <div>
                      <Label htmlFor="complement" className="text-sm font-medium text-gray-700 mb-2 block">
                        Complemento
                      </Label>
                      <Input
                        id="complement"
                        type="text"
                        value={formData.complement}
                        onChange={handleChange('complement')}
                        className="h-11"
                        placeholder="Ex: Bloco A"
                      />
                    </div>

                    <div>
                      <Label htmlFor="neighborhood" className="text-sm font-medium text-gray-700 mb-2 block">
                        Bairro *
                      </Label>
                      <Input
                        id="neighborhood"
                        type="text"
                        value={formData.neighborhood}
                        onChange={handleChange('neighborhood')}
                        className="h-11"
                        required
                        placeholder="Ex: Centro"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
                        Cidade *
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange('city')}
                        className="h-11"
                        required
                        placeholder="Ex: São Paulo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state" className="text-sm font-medium text-gray-700 mb-2 block">
                        Estado *
                      </Label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.state}
                        onChange={handleChange('state')}
                        className="h-11"
                        required
                        placeholder="Ex: SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="bg-gray-50 px-8 py-6 flex justify-between items-center border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>

              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                >
                  {submitting ? 'Criando...' : 'Criar Condomínio'}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Informação sobre próximos passos */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">O que acontece depois?</h3>
              <p className="text-sm text-blue-800">
                Após criar o condomínio, você poderá cadastrar unidades, moradores, 
                configurar áreas comuns e começar a gerenciar todas as atividades do seu condomínio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
